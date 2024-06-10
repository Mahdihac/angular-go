pipeline {
    agent any
    tools {
        nodejs '18.20.3'
    }

    environment {
        REPORT_PATH = 'zap-reports'
        REPORT_NAME = 'report.html'
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
        stage('Install Gitleaks') {
            steps {
                sh '''
                if ! command -v gitleaks &> /dev/null
                then
                    echo "Gitleaks could not be found, installing..."
                    curl -s https://api.github.com/repos/zricethezav/gitleaks/releases/latest | grep browser_download_url | grep linux | cut -d '"' -f 4 | wget -qi -
                    tar -xvf gitleaks*.tar.gz
                    sudo mv gitleaks /usr/local/bin/
                fi
                '''
            }
        }

        stage('Run Gitleaks') {
            steps {
                script {
                    def gitleaksStatus = sh script: 'gitleaks detect --source . --exit-code 1', returnStatus: true
                    if (gitleaksStatus != 0) {
                        error "Gitleaks detected secrets in the code!"
                    }
                }
            }
        }
        stage('NPM Build') {
            steps {
                dir("/var/lib/jenkins/workspace/userManagement/angular-frontend")
                {
                    sh "npm cache clean --force"
                    sh "npm install --legacy-peer-deps --verbose"
                    sh "npm run build"
                }
            }
        }
        
       /* stage('Run Tests') {
            steps {
                script {
                    def appPath = "/var/lib/jenkins/workspace/userManagement/angular-frontend"
                    docker.image('opensecurity/nodejsscan:latest').inside('--privileged -u root:root') {
                        sh 'nodejsscan --json .'
                    }
                }
            } 
        }*/
       /* stage('Analysis with SEMGREP') {
            steps {
                sh "docker run -e SEMGREP_APP_TOKEN=${SEMGREP_APP_TOKEN} --rm -v \${PWD}:/src semgrep/semgrep semgrep ci "
            } 
        }*/
        stage('Analysis with SONARQUBE') {
            steps {
                script {
                    withSonarQubeEnv(installationName: 'sonarqube-scanner') {
                        sh "/opt/sonar-scanner/bin/sonar-scanner -Dsonar.projectKey=${ANGULARKEY} -Dsonar.sources=. -Dsonar.host.url=${SONARURL} -Dsonar.login=${ANGLOGIN}"
                    }
                }
            }
        }
       /* stage('Containerization with DOCKER') {
            steps {
                script {
                    sh "docker build -t ${STAGING_TAG} ."
                    withCredentials([usernamePassword(credentialsId: 'tc', usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_PASSWORD')]) {
                        sh "docker login -u ${DOCKERHUB_USERNAME} -p ${DOCKERHUB_PASSWORD}"
                        sh "docker push ${STAGING_TAG}"
                    }
                }
            }
        }*/
        stage('Image Test with TRIVY') {
            steps {
                sh "docker run --rm aquasec/trivy image --exit-code 1 --no-progress ${STAGING_TAG}"
            }
        }
       /* stage('Pull Docker Image on Remote Server') {
            steps {
                sshagent(['ssh-agent']) {
                    sh 'ssh -o StrictHostKeyChecking=no vagrant@192.168.47.158 "docker run -d --name frontend -p 80:80 mahdihch/angular-frontend:2.0"'
                }
            }
        }*/
        stage('OWASP ZAP Full Scan') {
            steps {
                script {
                    /*sh "rm -rf ${REPORT_PATH}"
                    sh "mkdir -p ${REPORT_PATH}"
                    sh "chmod 777 ${REPORT_PATH}"*/
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
