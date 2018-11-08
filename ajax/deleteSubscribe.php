<?php
	$endpoint = $_POST['url'];
  
	$endpoint_parsed = parse_url($endpoint);
	$subscriber_id = end(explode('/', $endpoint_parsed['path']));

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

		if(in_array($subscriber_id, $subscribers[$find_browser])) {
			unset($subscribers[$browser][array_search($subscriber_id, $subscribers[$find_browser])]);
		}

		$json = json_encode($subscribers);

		if($fh = fopen('subscribers.json', 'w+')) {
			fwrite($fh, $json);
			fclose($fh);
			echo '{"response": "OK", "id": "'.$subscriber_id.'"}';
		}
    }
?>