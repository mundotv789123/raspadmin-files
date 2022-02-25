class Files {
    constructor(api_url = "api.php?path=") {
        this.api_url = api_url;
    }

    getFiles(path, func) {
        $.ajax({
            url: this.api_url + path,
            method: 'GET',
            data: {type: 'json'},
            contentType: "application/json",
            success: function (data) {
                if (!data) {
                    func({success: false, code: 204});
                    return;
                }
                func(data);
            },
            error: function (res) {
                func({success: false, code: res.status, message: 'Internal server error'});
            }
        });
    }

    doLogin(username, password, func) {
        $.ajax({
            url: this.api_url,
            method: 'POST',
            data: {
                username: username,
                password: password
            },
            success: function (data) {
                if (!data) {
                    func({success: false, code: 204});
                    return;
                }
                func(data);
            },
            error: function (res) {
                func({success: false, code: res.status, message: 'Internal server error'});
            }
        });
    }
}

class LoginMenu {
    constructor(onlogin) {
        this.onlogin = onlogin ? onlogin : (user, pass) => {};
        this.alertText = null;
    }

    build() {
        if (document.getElementById('login_menu'))
            return;

        /* criando elemento */
        this.element = document.createElement('div');
        this.element.id = 'login_menu';

        let title = document.createElement('h1');
        title.innerText = 'Login';

        this.alertText = document.createElement('p');
        this.alertText.style.display = 'none';

        /* inputs */
        let inputUser = document.createElement('input');
        inputUser.name = 'login_username';
        inputUser.placeholder = 'username';

        let inputPass = document.createElement('input');
        inputPass.name = 'login_password';
        inputPass.placeholder = 'password';
        inputPass.type = 'password';

        let buttonSubmit = document.createElement('button');
        buttonSubmit.innerText = "Login";
        buttonSubmit.type = 'button';
        buttonSubmit.onclick = () => {
            this.alertText.style.display = 'none';
            this.onlogin(inputUser.value, inputPass.value);
        };
        
        let form = document.createElement('form');

        /* evento quando enter for pressionado */
        form.addEventListener("keyup", (event) => {
            if (event.key === 'Enter') {
                buttonSubmit.click();
            }
        });
        
        /* construindo elemento */
        form.appendChild(title);
        form.appendChild(inputUser);
        form.appendChild(inputPass);
        form.appendChild(this.alertText);
        form.appendChild(buttonSubmit);

        this.element.appendChild(form);
        document.getElementsByTagName('body')[0].appendChild(this.element);
    }

    unbuild() {
        if (!this.element)
            return;
        this.element.remove();
        this.element = null;
    }

    updateForm(success, message) {
        if (success) {
            this.unbuild();
        } else {
            this.alertText.innerText = (message ? message : "Usuário ou senha inválido!");
            this.alertText.style.display = 'block';
        }
    }
}

class Player {
    constructor() {
        this.onstop = null;
        this.videos = [];
        this.videos_suport = ['mp4'];
        this.builded = false;
        this.player_element = null;
        this.file_name = null;
    }

    build() {
        if (this.builded)
            return;

        /* criando div */
        this.element = document.createElement('div');
        this.element.id = 'video_player';

        /* crindo video */
        this.v_element = document.createElement('video');
        this.v_element.autoplay = true;
        
        /* video eventos */
        this.v_element.onerror = () => {
            this.setLoading(false);
            this.v_element.style = 'display: none';
            let error_text = document.createElement('h');
            error_text.textContent = 'Ocorreu um erro ao abrir o video :(';
            error_text.className = 'video_error';
            this.element.appendChild(error_text);
        };
        
        this.v_element.oncanplay = () => {
            if (this.loaded)
                return;
            this.setLoading(false);
            this.saveTime(true);
            if ((this.v_element.duration - this.v_element.currentTime) <= 5) {
                this.v_element.currentTime = 0;
            }
            this.loaded=true;
        };
        
        this.v_element.onended = () => {
            let nextBTN = document.getElementById('video_btn_next');
            if (nextBTN) {
                location = nextBTN.href;
            }
        };
        
        this.v_element.controls = true;

        /* criando buttons */
        let closeBTN = document.createElement('button');
        closeBTN.id = 'video_btn_close';
        closeBTN.innerHTML = '<i class="fa fa-times" aria-hidden="true">';
        closeBTN.onclick = () => this.unbuild();

        /* construindo elemento */
        this.element.appendChild(this.v_element);
        this.element.appendChild(closeBTN);
        document.getElementsByTagName('body')[0].appendChild(this.element);

        this.builded = true;
    }

    setLoading(loading) {
        if (loading) {
            this.v_element.style = 'display: none';
            let loading_div = document.getElementById('video_loading');
            if (!loading_div) {
                loading_div = document.createElement('div');
                loading_div.id = 'video_loading';
                this.element.appendChild(loading_div);
                return;
            }
            loading_div.style = '';
        } else {
            let loading_div = document.getElementById('video_loading');
            if (loading_div) {
                loading_div.style = 'display: none';
            }
            this.v_element.style = '';
        }
    }

    issuported(name) {
        for (let c = 0; c < this.videos_suport.length; c++) {
            if (name.endsWith(this.videos_suport[c]))
                return true;
        }
        return false;
    }

    unbuild() {
        if (!this.builded)
            return;
        this.v_element.src = "";
        this.v_element.remove();
        this.element.remove();
        this.builded = false;
        if (this.onstop)
            this.onstop();
    }

    play(url) {
        if (!this.builded)
            this.build();

        this.setLoading(true);
        
        this.loaded = false;
        this.v_element.src = url;
        let urlDecoded = decodeURI(url);
        this.file_name = urlDecoded.substring(urlDecoded.lastIndexOf('/') + 1);
        
        this.v_element.currentTime = this.getTimeSaved();

        /* criando botão próximo */
        let nexturl = null;
        for (let c = 0; c < (this.videos.length - 1); c++) {
            if (this.videos[c].endsWith(this.file_name)) {
                nexturl = this.videos[c + 1];
                break;
            }
        }

        let nextBTN = document.getElementById('video_btn_next');
        if (!nexturl && nextBTN) {
            nextBTN.remove();
        }

        if (nexturl) {
            if (!nextBTN) {
                nextBTN = document.createElement('a');
                nextBTN.id = 'video_btn_next';
                nextBTN.innerHTML = '<i class="fa fa-fast-forward" aria-hidden="true"></i>';
            }
            nextBTN.href = nexturl;
            this.element.appendChild(nextBTN);
        }
    }

    getTimeSaved(video_name = null) {
        if (video_name === null)
            video_name = this.file_name;
        let videos = (localStorage['videos'] ? JSON.parse(localStorage['videos']) : {});
        return (videos[video_name] ? videos[video_name] : 0);
    }

    async saveTime(loop = false, reset = false) {
        if (!this.builded)
            return;

        let videos = (localStorage['videos'] ? JSON.parse(localStorage['videos']) : {});
        if (reset) {
            videos[this.file_name] = 0;
        } else if (this.v_element.currentTime > 0) {
            videos[this.file_name] = parseFloat(this.v_element.currentTime.toFixed(2));
        }
        localStorage['videos'] = JSON.stringify(videos);

        if (loop) {
            await new Promise(r => setTimeout(r, 500));
            this.saveTime(true);
        }
    }
}

class App {
    constructor(files_tab, files_cont) {
        this.files = new Files();
        this.player = new Player();
        this.login = new LoginMenu();
        this.login.onlogin = (username, password) => {
            if (username === "" || password === "") {
                this.login.updateForm(false, "Informe um usuário e senha!");
                return;
            }
            return this.files.doLogin(username, password, (data) => {
                this.login.updateForm(data.success);
                if (data.success) {
                    this.build();
                }
            });
        };
        this.path = '';
        this.files_tab = files_tab;
        this.files_cont = files_cont;
        this.loading = document.createElement('div');
        this.loading.id = 'files_loading';
    }

    /* construindo página */
    build() {
        /* carregando arquivos na barra lateral */
        if (this.files_tab !== null) {
            this.files.getFiles('/', (data) => {
                if (!data.success)
                    return;
                this.files_tab.innerHTML = "";
                if (data.files === undefined)
                    return;
                let files = Object.values(data.files);
                files.map((file) => {
                    if (!file.is_dir)
                        return;
                    let file_comp = document.createElement('a');
                    file_comp.href = '#' + ('/' + file.name);
                    file_comp.textContent = file.name;
                    this.files_tab.appendChild(file_comp);
                });
            });
        }
        this.updateFiles();
    }

    /* carregando arquivos da api */
    updateFiles(path = null) {
        this.loading.style = '';
        this.path = (path !== null ? path : this.path);
        
        /* limpando tela e informações */
        this.player.videos = [];
        this.files_cont.innerHTML = "";
        this.files_cont.appendChild(this.loading);

        this.files.getFiles(this.path, (data) => {
            this.loading.style = 'display: none';

            /* caso der erro */
            if (!data.success) {
                if (data.code === 401) {
                    this.login.build();
                    return;
                }
                let error = document.createElement('h1');
                error.textContent = this.getErrorText(data.code);
                this.files_cont.appendChild(error);
                return;
            }

            /* adicionando arquivos */
            if (!data.is_dir) {
                let splited_path = this.path.split('/');
                splited_path.splice(splited_path.length - 1);
                this.path = splited_path.join('/');
            }
            
            let files = Object.values(data.files);
            files.map((file) => {
                if (this.player.issuported(file.name))
                    this.player.videos.push('#' + this.path + '/' + file.name);
                this.files_cont.appendChild(this.getFileElement(file));
            });

            /* abrindo arquivo */
            if (!data.is_dir) {
                this.openFile(this.files.api_url + this.path + '/' + data.name);
            } else {
                this.player.unbuild();
            }
        });
    }

    getFileElement(file) {
        let file_comp = document.createElement('a');
        file_comp.href = '#' + (this.path + '/' + file.name);

        let icon_url = (file.icon ? (this.files.api_url + '/' + file.icon) : this.getFileIcon(file.name, file.is_dir));
        let file_icon = document.createElement('div');
        file_icon.style = "background-image: url('" + icon_url + "');";
        file_icon.className = "fileIcon" + (icon_url.endsWith('png') ? "" : " shadow");

        let file_name = document.createElement('p');
        file_name.textContent = file.name;
        file_name.className = (this.player.getTimeSaved(file.name) > 0 ? 'visited' : '');

        file_comp.appendChild(file_icon);
        file_comp.appendChild(file_name);
        return file_comp;
    }

    openFile(url) {
        if (this.player.issuported(url)) {
            this.player.play(url);
            return;
        }
        window.open(url, '_blank');
        location = '#' + this.path;
    }

    getFileIcon(name, is_dir = false) {
        const path_icons = './src/img/icons';
        if (is_dir) {
            return path_icons + '/folder.png';
        }
        let name_splited = name.split('.');
        switch (name_splited[name_splited.length - 1]) {
            case 'mp4':
            case 'mkv':
            case 'avi':
            case 'm4v':
                return path_icons + '/video.png';
            case "exe":
                return path_icons + '/exe.png';
            case "zip":
            case "rar":
            case "tar":
            case "gz":
                return path_icons + '/compact.png';
            case "java":
            case "jar":
            case "class":
                return path_icons + '/java.png';
            case 'iso':
            case 'img':
                return path_icons + '/iso.png';
            case "mp3":
                return path_icons + '/music.png';
            case "part":
                return path_icons + '/part.png';
        }
        return path_icons + '/document.png';
    }

    getErrorText(code) {
        switch (code) {
            case 404:
                return 'Arquivo ou pasta não encontrado!';
            case 403:
                return 'Conteúdo protegido!';
            case 401:
                return 'Autenticação necessária!';
            case 204:
                return 'Essa pasta está vazia!';
            default:
                return 'Erro interno ao acessar arquivos!';
        }
    }
}
