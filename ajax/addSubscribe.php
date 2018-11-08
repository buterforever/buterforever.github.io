<?php
  function logFile($textLog) {
    $file = 'logFile.txt';
    $text = '=======================\n';
    $text .= print_r($textLog);//Выводим переданную переменную
    $text .= '\n'. date('Y-m-d H:i:s') .'\n'; //Добавим актуальную дату после текста или дампа массива
    $fOpen = fopen($file,'a');
    fwrite($fOpen, $text);
    fclose($fOpen);
  }


	$endpoint = $_POST['url'];
  
	$endpoint_parsed = parse_url($endpoint);
	$subscriber_id = end(explode('/', $endpoint_parsed['path']));
  
	$find_browser = false;
    $urls = [
      'chrome' => 'https://android.googleapis.com/gcm/send/', 
      'firefox' => 'https://updates.push.services.mozilla.com/wpush/'
    ];
    foreach ($urls as $browser => $url) {
      if(strpos($endpoint, $url) !== false) {
        $find_browser = $browser;
        break;
      }
    }
    if($find_browser) {
      $subscribers = json_decode(file_get_contents('subscribers.json'), true);
      if(!in_array($subscriber_id, $subscribers[$find_browser])) {
        $subscribers[$find_browser][] = $subscriber_id;
        $json = json_encode($subscribers);
        if($fh = fopen('subscribers.json', 'w+')) {
          fwrite($fh, $json);
          fclose($fh);
          echo '{"response": "OK", "id": "'.$subscriber_id.'"}';
        }
      } else echo '{"response": "OK", "id": "'.$subscriber_id.'"}';
    }
?>