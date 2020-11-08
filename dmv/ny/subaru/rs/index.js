'use strict';

const map = new mapboxgl.Map({
	container: 'map',
	center: [-73.801913, 40.741396],
	zoom: 8.8,
	style: 'mapbox://styles/mapbox/dark-v10',
	attributionControl: false,
	logoPosition: 'bottom-right'
});

function onMapLoad()
{
	this.addSource('counties', {
		type: 'geojson',
		data: 'https://sourceboy.com/dmv/ny/subaru/rs/index.geojson'
	});

	this.addLayer({
		id: 'boundaries',
		type: 'line',
		source: 'counties',
		filter: ['==', '$type', 'Polygon'],
		paint: {
			'line-color': '#66ccff',
			'line-width': 1
		}
	});

	this.addLayer({
		id: 'labels',
		type: 'symbol',
		source: 'counties',
		filter: ['==', '$type', 'Point'],
		paint: { 'text-color': '#66ccff' },
		layout: {
			'text-allow-overlap': true,
			'text-size': 16,
			'text-field': ['get', 'county']
		},
	});

	this.addLayer({
		id: 'data',
		type: 'symbol',
		source: 'counties',
		filter: ['==', '$type', 'Point'],
		paint: { 'text-color': '#00ff00' },
		layout: {
			'text-allow-overlap': true,
			'text-justify': 'left',
			'text-anchor': 'top',
			'text-offset': [0, 1],
			'text-size': 12,
			'text-field': [
				'concat',
				'GM6: ', [ 'coalesce', [ 'get', '2d', ['get', 'data'] ], '0' ],
				'\nGC6: ', [ 'coalesce', [ 'get', '4d', ['get', 'data'] ], '0' ]
			]
		},
	});
}

map.on('load', onMapLoad);
