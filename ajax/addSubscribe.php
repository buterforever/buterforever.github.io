<?
	$subscriptionId[] = $_REQUEST['subscriptionId'];
	// добавляем $subscriptionId
	$fp = fopen($_SERVER['DOCUMENT_ROOT'] . '/subscribes.csv', 'a');
	fputcsv($fp, $subscriptionId);
	fclose($fp);
	echo 'Добавили в csv';
?>