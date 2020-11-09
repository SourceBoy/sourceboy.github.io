'use strict';

const map = new mapboxgl.Map({
	container: 'map',
	center: [-74.6137979, 42.5923162],
	zoom: 5.8,
	style: 'mapbox://styles/mapbox/dark-v10',
	attributionControl: false,
	logoPosition: 'bottom-right'
});

function getSum(property)
{
	const operator = '+';
	const type = 'number';
	const value = ['get', property];

	return [
		operator,
		[type, value, 0]
	];
}

function getColor(p)
{
	let r = 255;
	let g = 255;

	if ( (p >= 0) && (p <= 0.5) ) {
		g = 510 * p;
	} else if ( (p > 0.5) && (p <= 1) ) {
		r = (-510 * p) + 510;
	}

	const values = [r, g, 0].join(',');

	return `rgb(${values})`;
}

function onMapLoad()
{
	this.addSource('zips', {
		type: 'geojson',
		data: 'https://sourceboy.com/dmv/ny/subaru/index.geojson',
		cluster: true,
		clusterProperties: {
			sum_count: getSum('count'),
			sum_density: getSum('density'),
		}
	});

	this.addLayer({
		id: 'clusters',
		type: 'circle',
		source: 'zips',
		maxzoom: 10,
		filter: ['has', 'sum_density'],
		paint: {
			'circle-opacity': 0.75,
			/*
			'circle-color': [
				'interpolate', ['linear'],
				['get', 'sum_density'],
				1, 'rgb(0, 255, 0)',
				5, 'rgb(255, 255, 0)',
				10, 'rgb(255, 0, 0)'
			],
			*/
			'circle-color': [
				'step', ['get', 'sum_density'], getColor(1),
				1, getColor(0.75),
				5, getColor(0.5),
				10, getColor(0.25),
				25, getColor(0)
			],
			'circle-radius': [
				'step', ['get', 'sum_density'],
				20, 1,
				30, 5,
				40, 10,
				50, 25,
				60
			]
		}
	});

	this.addLayer({
		id: 'counts',
		type: 'symbol',
		source: 'zips',
		maxzoom: 10,
		filter: ['has', 'sum_count'],
		paint: { 'text-color': '#000000' },
		layout: {
			//'text-allow-overlap': true,
			//'text-anchor': 'top',
			//'text-offset': [0, 1.1],
			'text-size': 16,
			'text-field': ['get', 'sum_count'] // [ 'number-format', ['get', 'sum'], {} ]
		},
	});

	this.addLayer({
		id: 'labels',
		type: 'symbol',
		source: 'zips',
		minzoom: 10,
		paint: { 'text-color': '#66ccff' },
		layout: {
			//'text-allow-overlap': true,
			'text-size': 14,
			'text-field': [
				'concat',
				['get', 'city'], '\n', ['get', 'count']
			]
		},
	});
}

/*
map.on('zoom', function() {
	console.info(this.getZoom());
});

map.on('click', function() {
	console.info(this.getCenter());
});
*/

map.on('load', onMapLoad);
map.on('click', 'clusters', function(e) {
	this.flyTo({
		center: e.features[0].geometry.coordinates,
		zoom: this.getZoom() + 2
	});
});
