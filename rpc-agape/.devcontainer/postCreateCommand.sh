# if [[ -v GIT_EMAIL ]] && [[ -v GIT_NAME ]]; then  
#     git config --global credential.helper store
#     git config --global user.email $GIT_EMAIL
#     git config --global user.name $GIT_NAME
# fi  

# if [[ -v NGROK_TOKEN ]]; then  
#     curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
#         | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
#     && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
#         | tee /etc/apt/sources.list.d/ngrok.list \
#     && apt update \
#     && apt install ngrok

#     ngrok config add-authtoken $NGROK_TOKEN
# fi 

wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -