// Jenkins pipeline for skyphusion.net (Astro 6 -> Cloudflare Workers).
//
// What it does: on every push to main (a new or updated blog post, layout
// change, etc.) it type-checks the site and, if clean, builds and deploys the
// Worker to Cloudflare. There is no release-tag dance here (unlike
// vivijure-serverless); the blog is content-driven, so landing on main IS the
// release. Non-main branches are type-checked and built but never deployed.
//
// Jenkins job: a plain Pipeline-from-SCM (branch main, Script Path Jenkinsfile)
// on mindcrime, with a githubPush() trigger so every push fires the webhook.
//
// Credentials (Jenkins -> Manage Credentials), already present on mindcrime:
//   CLOUDFLARE_API_TOKEN   Secret Text  (token with Workers Scripts:Edit +
//                                        Workers Routes:Edit on the zone)
//   CLOUDFLARE_ACCOUNT_ID  Secret Text
//
// Runtime: a node:24 Docker agent (the full image, not -slim: `checkout scm`
// runs inside the container and needs git, which the slim variant omits). npm
// ci installs wrangler from devDependencies, so the agent needs only Docker.

pipeline {
    agent {
        docker {
            image 'node:24'
            // root so npm's cache + global dirs are writable; -v caches npm
            // between builds for faster `npm ci`.
            args  '-u root:root -v $HOME/.npm-skyphusion:/root/.npm'
        }
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '30', artifactNumToKeepStr: '10'))
    }

    environment {
        // wrangler reads these directly; no interactive login needed.
        CLOUDFLARE_API_TOKEN  = credentials('CLOUDFLARE_API_TOKEN')
        CLOUDFLARE_ACCOUNT_ID = credentials('CLOUDFLARE_ACCOUNT_ID')
        CI                    = 'true'
        npm_config_fund       = 'false'
        npm_config_audit      = 'false'
    }

    stages {
        stage('checkout') {
            steps {
                checkout scm
                script {
                    // BRANCH_NAME is only set for multibranch jobs; a plain
                    // Pipeline-from-SCM job exposes the ref via GIT_BRANCH
                    // (e.g. "origin/main"). Normalize both to a bare name so the
                    // deploy gate works regardless of how the job is wired.
                    env.GIT_REF = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: '')
                        .replaceFirst(/^origin\//, '')
                    echo "ref: ${env.GIT_REF ?: '(unknown)'}"
                }
            }
        }

        stage('install') {
            steps {
                // `npm ci` is reproducible and fails if package-lock.json is
                // out of sync with package.json (it must be committed).
                sh 'npm ci'
            }
        }

        stage('typecheck') {
            steps {
                // astro check = the strict type-check stage (.astro + TS +
                // content schema). Build alone would miss some of these.
                sh 'npm run typecheck'
            }
        }

        stage('build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('deploy') {
            // Only main reaches Cloudflare. Feature branches / PRs stop after
            // a green build, so a typo never ships from a side branch.
            when {
                expression { return env.GIT_REF == 'main' }
            }
            steps {
                // `wrangler deploy` (not `npm run deploy`) so we don't rebuild;
                // the build stage already produced dist/.
                sh 'npx wrangler deploy'
            }
        }
    }

    post {
        success {
            script {
                if (env.GIT_REF == 'main') {
                    echo 'Deployed skyphusion.net to Cloudflare Workers.'
                } else {
                    echo "Branch '${env.GIT_REF}' type-checked and built (not deployed)."
                }
            }
        }
        failure {
            echo 'Build failed. Check the typecheck / build / wrangler logs above.'
        }
        always {
            // Keep the shared npm cache but drop this build's workspace cruft.
            cleanWs(notFailBuild: true)
        }
    }
}
