<?php
	$subscriptionId[] = $_REQUEST['subscriptionId'];
	// добавляем $subscriptionId
	$fp = fopen($_SERVER['DOCUMENT_ROOT'] . '/subscribes.csv', 'a');
	fputcsv($fp, $subscriptionId);
	fclose($fp);
	
	$res = array('status' => 'ok', 'message' => 'Добавлено');
	echo json_encode($res);
?>