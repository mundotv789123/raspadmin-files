<?php
/* Configurações */
$auth = false;
$username = "admin";
$password = "admin";
$files_path = "./files";

function send_json($data, $code = 200) {
    header('HTTP/1.1 ' . $code);
    header("Content-Type: application/json");
    header("Accept: application/json");
    header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
    header("Access-Control-Allow-Origin: *");
    if ($data) {
        echo json_encode($data);
    }
    die();
}

function getFiles($path) {
    $files = [];
    $opn_dir = opendir($path);
    while ($rfile = readdir($opn_dir)) {
        if (substr($rfile, 0, 1) != "_" && substr($rfile, 0, 1) != "." && $rfile != "lost+found") {
            $is_dir = is_dir($path . '/' . $rfile);
            $files[$rfile] = [
                'name' => $rfile,
                'is_dir' => $is_dir
            ];
            /* get file icon */
            if ($is_dir) {
                if (file_exists($path . '/' . $rfile . '/_icon.jpg')) {
                    $files[$rfile]['icon'] = ($rfile . '/_icon.jpg');
                } else if (file_exists($path . '/' . $rfile . '/_icon.png')) {
                    $files[$rfile]['icon'] = ($rfile . '/_icon.png');
                }
            }
        }
    }
    ksort($files, SORT_NATURAL);
    return $files;
}

function send_file($path) {
    /* Abrindo arquivo */
    if (!($stream = fopen($path, 'rb'))) {
        send_json('Could not open this file', 500);
    }
    $size = filesize($path);

    /* Headers */
    ob_get_clean();
    header("Content-Type: " . mime_content_type($path));
    header("Cache-Control: max-age=2592000, public");

    header("Expires: " . gmdate('D, d M Y H:i:s', time() + 2592000) . ' GMT');
    header("Last-Modified: " . gmdate('D, d M Y H:i:s', @filemtime($path)) . ' GMT');

    /* Pegando range */
    if (isset($_SERVER['HTTP_RANGE'])) {
        $range = explode('=', $_SERVER['HTTP_RANGE'], 2)[1];
        $start = 0; 
        $end = 5120000;

        if (strpos($range, ',') !== false) {
            header('HTTP/1.1 416 Requested Range Not Satisfiable');
            header("Content-Range: bytes $start-$end/$size");
            exit();
        }
        $start = (($range == '-') ? ($size - substr($range, 1)) : (explode('-', $range)[0]));
        $end = $start + $end;
        $end = ($end > ($size - 1) ? ($size - 1) : $end);

        header('HTTP/1.1 206 Partial Content');
        header("Content-Range: bytes $start-$end/".$size);

        fseek($stream, $start);
        $size = $end - $start + 1;
    } else {
        header("Accept-Ranges: bytes");
        header("Content-Disposition: attachment; filename=\"".basename($path)."\"");
    }
    header("Content-Length: ".$size);
    
    /* Eviando arquivo */
    set_time_limit(0);
    $rate = 2560;

    $i = 0;
    while(!feof($stream)) {
        print fread($stream, ($rate * 1024));
        flush();
        sleep(1);
    }

    fclose($stream);
    exit();
}

/* Autenticação */
if ($auth) {
    $token = md5($username."-".$password);
    if ($_SERVER['REQUEST_METHOD'] == "POST") {
        if (md5($_POST['username']."-".$_POST['password']) == $token) {
            setcookie('RA_TOKEN', $token, time() + (7 * 24 * 60 * 60), "/", "", false, true);
            send_json(['success' => true]);
        }
        send_json(['success' => false]);
    }
    if (!isset($_COOKIE['RA_TOKEN']) || $_COOKIE['RA_TOKEN'] != $token) {
        send_json(['success' => false], 401);
    }
    setcookie('RA_TOKEN', $token, time() + (7 * 24 * 60 * 60), "/", "", false, true);
}

/* Caminho principal */
$main_real_path = realpath($files_path);

/* Pegando caminho pela url */
$path = trim($_GET['path']);
$real_path = realpath($main_real_path . $path);

/* Verificando se a pasta existe */
if (!$real_path) {
    send_json(['success' => false, 'message' => 'Not Found'], 404);
}

/* Verificando se o arquivo está dentro da pasta principal */
if (substr($real_path, 0, strlen($main_real_path)) !== $main_real_path) {
    send_json(['success' => false], 403);
}

/* Verificando se o arquivo é uma pasta */
if (!is_dir($real_path)) {
    if (isset($_GET['type']) && $_GET['type'] == "json") {
        send_json([
            'success' => true,
            'is_dir' => false,
            'name' => basename($real_path),
            'files' => getFiles(dirname($real_path))
        ]);
    }
    send_file($real_path);
}

/* Eviando arquivos para o front em json */
$listed_files = getFiles($real_path);
if (empty($listed_files)) {
    send_json(null, 204);
}
send_json([
    'success' => true,
    'is_dir' => true,
    'files' => $listed_files
]);
