<?php
	$subscriptionId = $_REQUEST['subscriptionId'];
	// добавляем $subscriptionId
	$fp = fopen($_SERVER['DOCUMENT_ROOT'] . '/subscribes.csv', 'r');
	
	$array_line_full = array(); //Массив будет хранить данные из csv
    //Проходим весь csv-файл, и читаем построчно. 3-ий параметр разделитель поля
    while (($line = fgetcsv($fp, 0, ";")) !== FALSE) {
    	if (!in_array($subscriptionId, $line))
        	$array_line_full[] = $line; //Записываем строчки в массив
    }
	fclose($fp);

	// записываем новый csv файл
	$handle = fopen($_SERVER['DOCUMENT_ROOT'] . '/subscribes.csv', "w");
    foreach ($array_line_full as $value) { //Проходим массив
        fputcsv($handle, $value, ";");
    }
    fclose($handle); //Закрываем
	
	$res = array('status' => 'ok', 'message' => 'Удалено из csv');
	echo json_encode($res);
?>