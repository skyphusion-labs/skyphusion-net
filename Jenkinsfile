// Jenkins pipeline for skyphusion.net (Astro 6 -> Cloudflare Workers).
//
// What it does: on every push to main (a new or updated blog post, layout
// change, etc.) it type-checks the site and, if clean, builds and deploys the
// Worker to Cloudflare. There is no release-tag dance here (unlike
// vivijure-serverless); the blog is content-driven, so landing on main IS the
// release. Non-main branches are type-checked and built never deployed.
//
// Jenkins job: multibranch pipeline (GitHub source SkyPhusion/skyphusion-net,
// branch discovery, Script Path Jenkinsfile) on dischord Jenkins, fed by a
// repo githubPush() webhook so every push triggers a scan + build.
//
// Credentials (Jenkins -> Manage Credentials), present on dischord Jenkins:
//   CLOUDFLARE_API_TOKEN   Secret Text  (token with Workers Scripts:Edit +
//                                        Workers Routes:Edit on the zone)
//   CLOUDFLARE_ACCOUNT_ID  Secret Text
//
// Runtime: runs on the HEL1 fleet (label: build) inside an ephemeral Docker
// agent. The @astrojs/cloudflare v13 adapter renders prerendered routes inside
// a workerd subprocess during `astro build`; workerd requires kernel namespace
// support (CLONE_NEWUSER/CLONE_NEWNET) which is enabled via seccomp=unconfined
// on the agent container (see fleet-chezmoi docker-clouds.yaml). Node 22 is
// required by Astro 6; the agent image ships Node 22.

pipeline {
    agent { label 'build' }

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
                    // Multibranch jobs set BRANCH_NAME; fall back to GIT_BRANCH
                    // (e.g. "origin/main") so the deploy gate also works if this
                    // is ever rewired as a plain Pipeline-from-SCM job. Normalize
                    // to a bare branch name.
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
