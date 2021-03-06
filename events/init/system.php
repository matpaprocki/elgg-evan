<?php

elgg_register_admin_menu_item('administer', 'browse', 'users');


foreach (evan_get_plugins() as $plugin) {
	$mod = dirname(dirname(dirname(__DIR__)));
	
	$filepath = "$mod/$plugin/elgg.json";
	if (!file_exists($filepath)) {
		continue;
	}
	
	// Experimental manifest-based configuration!!
	$manifest = json_decode(file_get_contents($filepath), true);
	
	if (!$manifest) {
		throw new Exception("$plugin plugin's elgg.json was invalid or unreadable!");
	}
	
	// Register scripts based on manifest
	foreach ($manifest['scripts'] as $name => $options) {
		elgg_register_js($name, (array)$options);
	}
	
	// Register view options like extensions, caching, ajax, etc.
	foreach ($manifest['views'] as $view => $options) {
		foreach ($options['extensions'] as $extension => $priority) {
			if ($priority === false) {
				elgg_unextend_view($view, $extension);
			} else {
				elgg_extend_view($view, $extension, $priority);
			}
		}
		
		if (isset($options['ajax'])) {
			if ($options['ajax']) {
				elgg_register_ajax_view($view);
			} else {
				elgg_unregister_ajax_view($view);
			}
		}
		
		if (isset($options['cache']) && $options['cache']) {
			elgg_register_simplecache_view($view);
		}
	}
	
	foreach ($manifest['routes'] as $route => $path) {
		$file = elgg_get_plugins_path() . "evan/pages/$path.php";
		// echo "$file <br>";
		EvanRoute::registerOne($route, $file);
	}
}