pipeline {
    agent any
    tools {
        nodejs '18.20.3'
    }

    environment {
        REPORT_PATH = 'zap-reports'
        REPORT_NAME = 'report.html'
        SNYK_API = 'https://api.snyk.io'
        FRONTEND_TAG = "mahdihch/angular-front:${env.BUILD_NUMBER}"
        BACKEND_TAG = "mahdihch/go-back:${env.BUILD_NUMBER}"
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
        stage('Run Gitleaks') {
            steps {
                catchError(buildResult: 'SUCCESS' , stageResult: 'FAILURE') {
                    script {
                        def gitleaksStatus = sh script: 'gitleaks detect --source . --exit-code 1', returnStatus: true
                        if (gitleaksStatus != 0) {
                            error "Gitleaks detected secrets in the code!"
                        }
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
        stage('Run Snyk Security Scan') {
            steps {
                dir("/var/lib/jenkins/workspace/userManagement/angular-frontend")
                {
                    sh "npm install -g snyk"
                    sh "pwd"
                    sh "snyk auth ${SNYK_KEY}"
                    sh "snyk test --file=package.json --severity-threshold=low --json  | tee snyk-report.json"
                    sh "cat snyk-report.json"
                }
            }
        }
        stage('Run SAST tests') {
            steps {
                script {
                    def appPath = "/var/lib/jenkins/workspace/userManagement/angular-frontend"
                    docker.image('opensecurity/nodejsscan:latest').inside('--privileged -u root:root') {
                        sh 'nodejsscan --json . | tee njsscan-report.json '
                    }
                }
            } 
        }
       stage('SAST with SEMGREP') {
            steps {
                sh "docker run -e SEMGREP_APP_TOKEN=${SEMGREP_APP_TOKEN} --rm -v \${PWD}:/src semgrep/semgrep semgrep ci "
            } 
        }
        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner';
                    withSonarQubeEnv() {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }
        stage('Build Frontend Docker Image') {
            steps {
                script {
                    dir('angular-frontend') {
                        sh "docker build -t ${FRONTEND_TAG} ."
                        withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_PASSWORD')]) {
                            sh "docker login -u ${DOCKERHUB_USERNAME} -p ${DOCKERHUB_PASSWORD}"
                            sh "docker push ${FRONTEND_TAG}"
                        }
                    }
                }
            }
        }
        stage('Build Backend Docker Image') {
            steps {
                script {
                    dir('go-backend') {
                        sh "docker build -t ${BACKEND_TAG} ."
                        withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_PASSWORD')]) {
                            sh "docker login -u ${DOCKERHUB_USERNAME} -p ${DOCKERHUB_PASSWORD}"
                            sh "docker push ${BACKEND_TAG}"
                        }
                    }
                }
            }
        }
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
