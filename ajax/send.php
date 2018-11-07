<?
	echo 'Отправим уведомление';

	$subscription_id = 'eSkr5RaqjYk:APA91bFCVL1xvJGRojjQusLRQaQGBxt8IhsMdhQejXd5A1qPeNgd8eI1_xNQiL0bGt3EyN8rFtnvZbOD7cVXIqknZuMN3x3ci_opi5K1DU9p2VhCODqztxrWbAa0KPHcLLopHSb78qZi';
	$YOUR_API_KEY = 'AIzaSyDZ_NECeaQFUcGIKZpTTJ1J1el0FisMBZw'; // Server key


	function send_push_message($subscriptionIDs) {
	  if (empty($subscriptionIDs)) return FALSE;
	  $chs = $sChrome = array();
	  $mh = curl_multi_init();
	  foreach ($subscriptionIDs as $subscription) {
	    $i = count($chs);
	    switch ($subscription["browser"]) {
	      case "firefox":
	        $chs[ $i ] = curl_init();
	        curl_setopt($chs[ $i ], CURLOPT_URL, "https://updates.push.services.mozilla.com/push/v5/".$subscription["id"] );
	        curl_setopt($chs[ $i ], CURLOPT_PUT, TRUE);
	        curl_setopt($chs[ $i ], CURLOPT_RETURNTRANSFER, TRUE);
	        curl_setopt($chs[ $i ], CURLOPT_SSL_VERIFYPEER, FALSE);
	        curl_setopt($chs[ $i ], CURLOPT_HTTPHEADER, array('TTL: TIME_TO_LIVE'));

	        curl_multi_add_handle($mh, $chs[ $i ]);
	        break;
	      case "chrome":
	        $sChrome[] = $subscription["id"];
	        break;
	    }
	  }
	  if (!empty($sChrome)) {
	    $i = count($chs);
	    $chs[ $i ] = curl_init();
	    curl_setopt($chs[ $i ], CURLOPT_URL, "https://android.googleapis.com/gcm/send" );
	    curl_setopt($chs[ $i ], CURLOPT_POST, TRUE);
	    curl_setopt($chs[ $i ], CURLOPT_HTTPHEADER, array( "Authorization: key=" . $YOUR_API_KEY, "Content-Type: application/json" ) );
	    curl_setopt($chs[ $i ], CURLOPT_RETURNTRANSFER, TRUE);
	    curl_setopt($chs[ $i ], CURLOPT_SSL_VERIFYPEER, FALSE);
	    curl_setopt($chs[ $i ], CURLOPT_POSTFIELDS, json_encode( array( "registration_ids" => $sChrome, 'time_to_live' =>  TIME_TO_LIVE) ) );
	    curl_multi_add_handle($mh, $chs[ $i ]);
	  }

	  do {
	    curl_multi_exec($mh, $running);
	    curl_multi_select($mh);
	  } while ($running > 0);

	  for ($i = 0; $i < count($chs); $i++) {
	    curl_multi_remove_handle($mh, $chs[ $i ]);
	  }

	  curl_multi_close($mh);
	}

	/*$url = 'https://fcm.googleapis.com/fcm/send';
	$YOUR_TOKEN_ID = $subscription_id; // Client token id

	$request_body = [
	    'to' => $YOUR_TOKEN_ID,
	    'notification' => [
	        'title' => 'Ералаш',
	        'body' => sprintf('Начало в %s.', date('H:i')),
	        'icon' => 'https://eralash.ru.rsz.io/sites/all/themes/eralash_v5/logo.png?width=192&height=192',
	        'click_action' => 'http://eralash.ru/',
	    ],
	];
	$fields = json_encode($request_body);

	$request_headers = [
	    'Content-Type: application/json',
	    'Authorization: key=' . $YOUR_API_KEY,
	];

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
	curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
	$response = curl_exec($ch);
	curl_close($ch);

	echo $response;*/

?>