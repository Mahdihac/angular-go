pipeline {
    agent any
    tools {
        nodejs '18.20.3'
    }

    environment {
        REPORT_PATH = 'zap-reports'
        REPORT_NAME = 'report.xml'
        SNYK_API = 'https://api.snyk.io'
        FRONTEND_TAG = "mahdihch/angular-front:${env.BUILD_NUMBER}"
        BACKEND_TAG = "mahdihch/go-back:${env.BUILD_NUMBER}"
        SSH_PASSWORD = credentials('SSH_PASSWORD')
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
        stage('Run NJSSCAN') {
            steps {
                script {
                    def appPath = "/var/lib/jenkins/workspace/userManagement/angular-frontend"
                    docker.image('opensecurity/nodejsscan:latest').inside('--privileged -u root:root') {
                        sh 'nodejsscan --json . | tee njsscan-report.json '
                    }
                }
            } 
        }
       stage('Run SEMGREP') {
            steps {
                sh "docker run -e SEMGREP_APP_TOKEN=${SEMGREP_APP_TOKEN} --rm -v \${PWD}:/src semgrep/semgrep semgrep ci "
            } 
        }
        stage('Run SonarQube Analysis') {
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
        stage('Run Image Test with TRIVY') {
            steps {
                sh "docker pull aquasec/trivy:0.52.2"
                sh "docker run -v /var/run/docker.sock:/var/run/docker.sock -v $HOME/Library/Caches:/root/.cache/ aquasec/trivy:0.52.2 image docker.io/${FRONTEND_TAG} > frontend-output.txt"
                sh "docker run -v /var/run/docker.sock:/var/run/docker.sock -v $HOME/Library/Caches:/root/.cache/ aquasec/trivy:0.52.2 image docker.io/${BACKEND_TAG} > backend-output.txt "  
            }
        }
        stage('Run OWASP ZAP Full Scan') {
            steps {
                script {
                        dir('/home/user1') {
                            sh "docker-compose up"
                            sh "rm -rf ${REPORT_PATH}"
                            sh "mkdir -p ${REPORT_PATH}"
                            sh "chmod 777 ${REPORT_PATH}"
                            sh "docker run --rm  -u root -v /home/user1:${REPORT_PATH}:rw -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py -t http://10.0.110.7:4200/ -r ${REPORT_PATH}/${REPORT_NAME}"
                
                        }
                }
            }
        }
        stage('Run Kube-Bench'){
            steps{
                script{
                    // sh "kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml"
                    // sh "cd /home/node01"
                    // sh "./kube_bench.sh"
                    sh 'sshpass -p "$SSH_PASSWORD" ssh root@10.0.110.12 "kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml && cd /home/node01 && ./kube_bench.sh"'
                }
            }
        }
    }
}
