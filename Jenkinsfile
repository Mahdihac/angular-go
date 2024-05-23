pipeline {
    agent any

    environment {
        REPORT_PATH = 'zap-reports'
        REPORT_NAME = 'report.html'
        // Define the NVM version you want to install
        NVM_VERSION = 'v0.39.4'
        // Define the Node.js version you want to install
        NODE_VERSION = '14.17.0'
        // Define the directory for NVM installation
        NVM_DIR = "${WORKSPACE}/.nvm"
    }

    stages {
        stage('Checkout Git') {
            steps {
                script {
                    git branch: 'main',
                    url: 'https://github.com/Mahdihac/angular-go.git'
                } 
            }
        }
        stage('NPM Build') {
            steps {
                script {
                    // Download and install NVM
                    sh "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh | bash"
                    // Source NVM
                    sh "export NVM_DIR='${NVM_DIR}'"
                    sh "[ -s '${NVM_DIR}/nvm.sh' ] && \\. '${NVM_DIR}/nvm.sh'"
                    sh "nvm install ${NODE_VERSION}"
                    sh "nvm use ${NODE_VERSION}"
                    sh "nvm alias default ${NODE_VERSION}"
                    // Verify Node.js and npm installation
                    sh "node -v"
                    sh "npm -v"
                    sh "npm cache clean --force"
                    sh "npm install --legacy-peer-deps --verbose"
                    sh "npm run build"
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    def appPath = "/var/lib/jenkins/workspace/userManagement/angular-frontend"
                    docker.image('opensecurity/nodejsscan:latest').inside('--privileged -u root:root') {
                        sh 'nodejsscan --json .'
                    }
                }
            }
        }
        stage('Dependencies Test with SNYK') {
            steps {
                snykSecurity(
                    snykInstallation: 'snyk@latest',
                    snykTokenId: 'snyk-token',
                    failOnIssues: false,
                    monitorProjectOnBuild: true,
                    additionalArguments: '--all-projects --d'
                )
            }
        }
        stage('Analysis with SEMGREP') {
            steps {
                sh "docker run -e SEMGREP_APP_TOKEN=${SEMGREP_APP_TOKEN} --rm -v \${PWD}:/src semgrep/semgrep semgrep ci "
            }
        }
        stage('Analysis with SONARQUBE') {
            steps {
                script {
                    withSonarQubeEnv(installationName: 'sonarqube-scanner') {
                        sh "/opt/sonar-scanner/bin/sonar-scanner -Dsonar.projectKey=${ANGULARKEY} -Dsonar.sources=. -Dsonar.host.url=${SONARURL} -Dsonar.login=${ANGLOGIN}"
                    }
                }
            }
        }
        stage('Containerization with DOCKER') {
            steps {
                script {
                    sh "docker build -t ${STAGING_TAG} ."
                    withCredentials([usernamePassword(credentialsId: 'tc', usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_PASSWORD')]) {
                        sh "docker login -u ${DOCKERHUB_USERNAME} -p ${DOCKERHUB_PASSWORD}"
                        sh "docker push ${STAGING_TAG}"
                    }
                }
            }
        }
        stage('Image Test with TRIVY') {
            steps {
                sh "docker run --rm aquasec/trivy image --exit-code 1 --no-progress ${STAGING_TAG}"
            }
        }
        stage('Pull Docker Image on Remote Server') {
            steps {
                sshagent(['ssh-agent']) {
                    sh 'ssh -o StrictHostKeyChecking=no vagrant@1192.168.47.158 "docker run -d --name frontend -p 80:80 mahdihch/angular-frontend:2.0"'
                }
            }
        }
        stage('Container Test with SNYK') {
            steps {
                snykSecurity(
                    snykInstallation: 'snyk@latest',
                    snykTokenId: 'snyk-token',
                    failOnIssues: false,
                    monitorProjectOnBuild: true,
                    additionalArguments: "--container ${STAGING_TAG} -d"
                )
            }
        }
        stage('OWASP ZAP Full Scan') {
            steps {
                script {
                    sh "rm -rf ${REPORT_PATH}"
                    sh "mkdir -p ${REPORT_PATH}"
                    sh "chmod 777 ${REPORT_PATH}"
                    sh "sudo docker run -v ${WORKSPACE}:${REPORT_PATH}:rw -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py -t http://192.168.47.158:80/ -r ${REPORT_PATH}/${REPORT_NAME} || true"
                }
            }
        }
        stage('Run Nuclei') {
            steps {
                sh "nuclei -u http://192.168.47.158:80 -o nuclei_report.json"
            }
        }
    }
}
