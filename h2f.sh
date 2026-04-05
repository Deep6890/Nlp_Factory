#!/bin/bash

echo "username: $(whoami)"

echo "hostname: $(uname -n)"

PUBLIC_IP=$(curl -s https://api.ipify.org)
echo "public_ip: ${PUBLIC_IP:-Unavailable}"

MAC=$(ip link | awk '/ether/ {print $2; exit}')
echo "mac_address: ${MAC:-Unavailable}"

echo "git_username: $(git config user.name 2>/dev/null)"
echo "git_email: $(git config user.email 2>/dev/null)"

echo "timestamp: $(date)"

