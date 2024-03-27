pipeline {
    agent any

    environment {
        DOCKER_REGISTRY_CREDENTIALS_FRONTEND = 'docker-hub-credentials-frontend'
        DOCKER_REGISTRY_CREDENTIALS_BACKEND = 'docker-hub-credentials-backend'
        DOCKER_REGISTRY_CREDENTIALS_DATABASE = 'docker-hub-credentials-database'
        KUBECONFIG = credentials('kubeconfig-credentials')
    }

    stages {
        stage('Build') {
            steps {
                script {
                    // Checkout source code from Git repository
                    checkout scm

                    // Build Angular frontend
                    withCredentials([usernamePassword(credentialsId: DOCKER_REGISTRY_CREDENTIALS_FRONTEND, usernameVariable: 'DOCKER_USERNAME_FRONTEND', passwordVariable: 'DOCKER_PASSWORD_FRONTEND')]) {
                        sh 'cd frontend && npm install && npm run build'
                        sh 'docker build -t your-docker-hub-username/frontend .'
                        sh 'docker login -u $DOCKER_USERNAME_FRONTEND -p $DOCKER_PASSWORD_FRONTEND'
                        sh 'docker push your-docker-hub-username/frontend'
                    }

                    // Build Golang backend
                    withCredentials([usernamePassword(credentialsId: DOCKER_REGISTRY_CREDENTIALS_BACKEND, usernameVariable: 'DOCKER_USERNAME_BACKEND', passwordVariable: 'DOCKER_PASSWORD_BACKEND')]) {
                        sh 'cd backend && go build'
                        sh 'docker build -t your-docker-hub-username/backend .'
                        sh 'docker login -u $DOCKER_USERNAME_BACKEND -p $DOCKER_PASSWORD_BACKEND'
                        sh 'docker push your-docker-hub-username/backend'
                    }

                    // Build database image (if applicable)
                    // Replace placeholders accordingly
                }
            }
        }
        
        stage('Test') {
            steps {
                script {
                    // Run tests (if applicable)
                    // For example: sh 'cd backend && go test'
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Deploy to Kubernetes cluster
                    sh 'kubectl --kubeconfig=$KUBECONFIG apply -f kube-manifests/'
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}