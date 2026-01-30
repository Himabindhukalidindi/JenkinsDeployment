//Jenkins pipeline file created event  modifies
pipeline {
    agent any

    tools {
        nodejs 'NodeJS' 
    }

    environment {
        PATH = "${tool 'NodeJS'}/bin:${env.PATH}"
    }

    parameters {
        string(name: 'TEST_CONFIG_FILE', defaultValue: 'playwright.config.ts', description: 'Path to the Playwright configuration file to use')
        string(name: 'TEST_PARAMS_FILE', defaultValue: 'tests/params.json', description: 'Path to a JSON file containing test parameters')
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    bat 'npm ci'
                    bat 'npx playwright install --with-deps'
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    echo "Running tests using config: ${params.TEST_CONFIG_FILE}"
                    echo "Using params file: ${params.TEST_PARAMS_FILE}"
                    
                    withEnv(["TEST_PARAMS_FILE=${params.TEST_PARAMS_FILE}"]) {
                        if (fileExists(params.TEST_CONFIG_FILE)) {
                             bat "npx playwright test --config=${params.TEST_CONFIG_FILE}"
                        } else {
                            error "Config file '${params.TEST_CONFIG_FILE}' not found!"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true

            allure([
                includeProperties: false,
                jdk: '',
                properties: [],
                reportBuildPolicy: 'ALWAYS',
                results: [[path: 'allure-results']]
            ])
        }
    }
}
