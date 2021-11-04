# Raspadmin Arquivos

Site Demo: https://arquivos.raspadmin.tk

![Alt text](./src/img/raspadmin.png?raw=true "RaspAdmin File Manager")

Sistema de login

![Alt text](./src/img/raspadmin-login.png?raw=true "RaspAdmin File Manager Login")

**Função**
- Facilitar navegação entre arquivos em um servidor web.
- Abrir vídeos sem baixar de forma dinâmica.

**Notas**
- Lembre-se de configurar o seu servidor web.
- A pasta **./files** é a pasta principal que será listada.

**Instalação no nginx**
- Para ativar o php basta adicionar essa linha.
```
location ~ \.php$ {
       include snippets/fastcgi-php.conf;
       fastcgi_pass unix:/var/run/php/php7.2-fpm.sock;
}
```

**Configurações de segurança**
- Lembre-se de bloquear a pasta files ou colocar fora da pasta html pública por segurança.
- Para bloquear o acesso basta adicionar essa linha no seu nginx.

```
location /files {
       deny all;
}
```

- Depois só instalar o **php7.2-fpm** (no ubuntu ou debian você pode instalado com o comando **apt install php7.2-fpm**)
- Após isso basta reiniciar o nginx com o comando: **service nginx reload**

