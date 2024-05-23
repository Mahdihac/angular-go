pipeline {
    agent any
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
        stage('NPM Build') {
            steps {
                dir('/var/lib/jenkins/workspace/userManagement/angular-frontend') {
                    sh "node -v"
                    sh "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
                    sh "nvm install 18"
                    sh "node -v"
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
                    failOnIssues: 'false',
                    monitorProjectOnBuild: 'true',
                    additionalArguments: '--all-projects --d'
                )
            }
        }
        stage('Analysis with SEMGREP') {
            steps {
                //sh "docker run -v ${WORKSPACE}:/src --workdir /src semgrep/semgrep --config p/ci"
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
                        // sh "docker pull ${STAGING_TAG}"
                    }
                }
            }
        }
        stage('Image Test with TRIVY') {
            steps {
                sh "docker run --rm aquasec/trivy image --exit-code 1 --no-progress ${STAGING_TAG}"
                //sh "docker run --rm aquasec/trivy:latest image balkissd/angular:v1.0.0"
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
                    failOnIssues: 'false',
                    monitorProjectOnBuild: 'true',
                    additionalArguments: '--container ${STAGING_TAG} -d'
                )
            }
        }
        stage('OWASP ZAP Full Scan') {
            steps {
                script {
                    sh "rm -rf /var/lib/jenkins/workspace/Front/report"
                    sh "mkdir -p /var/lib/jenkins/workspace/Front/report"
                    sh "chmod 777 /var/lib/jenkins/workspace/Front/report"
                    sh "sudo docker run -v /var/lib/jenkins/workspace/Front:/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py -t http://192.168.47.158:80/ -r report/testreport.html || true"
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
