(function () {
	function executeTestCase(browserInfo) {

		function callEventCallback(type, data) {
			var cbs = eventListeners[type];
			if (cbs && cbs.length > 0) {
				for (var i = 0; i < cbs.length; i++) {
					cbs[i](data);
				}
			}

		}

		function checkForDimension(res1, res2) {

			if (typeof res1 == 'object') {
				if (res1 && res2 && res1.length >= 1 && res2.length >= 1 && res1[0].width == res2[0].width && res1[0].height == res2[0].height) {
					return true;
				} else {
					return false;
				}
			} else {
				if (res1 == res2) {
					return true;
				} else {
					return false;
				}
			}
		}
		var expectedBoundary = {
			right: 3840,
			bottom: 1080
		}
		var displayInfoArr = {
			"0": {
				"mm_negative": [{
						"bounds": {
							"height": 1080,
							"left": 0,
							"top": 0,
							"width": 1920
						},
						"dpiX": 101.5999984741211,
						"dpiY": 101.5999984741211,
						"hasTouchSupport": false,
						"id": "2764161111015424",
						"isEnabled": true,
						"isInternal": false,
						"isPrimary": false,
						"mirroringSourceId": "",
						"modes": [{
								"deviceScaleFactor": 1,
								"height": 400,
								"heightInNativePixels": 400,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 720,
								"widthInNativePixels": 720
							}, {
								"deviceScaleFactor": 1,
								"height": 480,
								"heightInNativePixels": 480,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 640,
								"widthInNativePixels": 640
							}, {
								"deviceScaleFactor": 1,
								"height": 600,
								"heightInNativePixels": 600,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 800,
								"widthInNativePixels": 800
							}, {
								"deviceScaleFactor": 1,
								"height": 624,
								"heightInNativePixels": 624,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 832,
								"widthInNativePixels": 832
							}, {
								"deviceScaleFactor": 1,
								"height": 576,
								"heightInNativePixels": 576,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1024,
								"widthInNativePixels": 1024
							}, {
								"deviceScaleFactor": 1,
								"height": 768,
								"heightInNativePixels": 768,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1024,
								"widthInNativePixels": 1024
							}, {
								"deviceScaleFactor": 1,
								"height": 720,
								"heightInNativePixels": 720,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1280,
								"widthInNativePixels": 1280
							}, {
								"deviceScaleFactor": 1,
								"height": 864,
								"heightInNativePixels": 864,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1152,
								"widthInNativePixels": 1152
							}, {
								"deviceScaleFactor": 1,
								"height": 800,
								"heightInNativePixels": 800,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1280,
								"widthInNativePixels": 1280
							}, {
								"deviceScaleFactor": 1,
								"height": 960,
								"heightInNativePixels": 960,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1280,
								"widthInNativePixels": 1280
							}, {
								"deviceScaleFactor": 1,
								"height": 1024,
								"heightInNativePixels": 1024,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1280,
								"widthInNativePixels": 1280
							}, {
								"deviceScaleFactor": 1,
								"height": 900,
								"heightInNativePixels": 900,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1600,
								"widthInNativePixels": 1600
							}, {
								"deviceScaleFactor": 1,
								"height": 1050,
								"heightInNativePixels": 1050,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1680,
								"widthInNativePixels": 1680
							}, {
								"deviceScaleFactor": 1,
								"height": 1080,
								"heightInNativePixels": 1080,
								"isNative": true,
								"isSelected": true,
								"uiScale": 1,
								"width": 1920,
								"widthInNativePixels": 1920
							}
						],
						"name": "BenQG2222HDAL",
						"overscan": {
							"bottom": 0,
							"left": 0,
							"right": 0,
							"top": 0
						},
						"rotation": 0,
						"workArea": {
							"height": 1032,
							"left": 0,
							"top": 0,
							"width": 1920
						}
					}, {
						"bounds": {
							"height": 1080,
							"left": -1920,
							"top": 0,
							"width": 1920
						},
						"dpiX": 101.5999984741211,
						"dpiY": 101.5999984741211,
						"hasTouchSupport": false,
						"id": "2763893501653249",
						"isEnabled": true,
						"isInternal": false,
						"isPrimary": true,
						"mirroringSourceId": "",
						"modes": [{
								"deviceScaleFactor": 1,
								"height": 400,
								"heightInNativePixels": 400,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 720,
								"widthInNativePixels": 720
							}, {
								"deviceScaleFactor": 1,
								"height": 480,
								"heightInNativePixels": 480,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 640,
								"widthInNativePixels": 640
							}, {
								"deviceScaleFactor": 1,
								"height": 600,
								"heightInNativePixels": 600,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 800,
								"widthInNativePixels": 800
							}, {
								"deviceScaleFactor": 1,
								"height": 624,
								"heightInNativePixels": 624,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 832,
								"widthInNativePixels": 832
							}, {
								"deviceScaleFactor": 1,
								"height": 768,
								"heightInNativePixels": 768,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1024,
								"widthInNativePixels": 1024
							}, {
								"deviceScaleFactor": 1,
								"height": 720,
								"heightInNativePixels": 720,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1152,
								"widthInNativePixels": 1152
							}, {
								"deviceScaleFactor": 1,
								"height": 720,
								"heightInNativePixels": 720,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1280,
								"widthInNativePixels": 1280
							}, {
								"deviceScaleFactor": 1,
								"height": 864,
								"heightInNativePixels": 864,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1152,
								"widthInNativePixels": 1152
							}, {
								"deviceScaleFactor": 1,
								"height": 800,
								"heightInNativePixels": 800,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1280,
								"widthInNativePixels": 1280
							}, {
								"deviceScaleFactor": 1,
								"height": 960,
								"heightInNativePixels": 960,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1280,
								"widthInNativePixels": 1280
							}, {
								"deviceScaleFactor": 1,
								"height": 900,
								"heightInNativePixels": 900,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1440,
								"widthInNativePixels": 1440
							}, {
								"deviceScaleFactor": 1,
								"height": 1024,
								"heightInNativePixels": 1024,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1280,
								"widthInNativePixels": 1280
							}, {
								"deviceScaleFactor": 1,
								"height": 1050,
								"heightInNativePixels": 1050,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1680,
								"widthInNativePixels": 1680
							}, {
								"deviceScaleFactor": 1,
								"height": 1080,
								"heightInNativePixels": 1080,
								"isNative": true,
								"isSelected": true,
								"uiScale": 1,
								"width": 1920,
								"widthInNativePixels": 1920
							}
						],
						"name": "BenQ G2220HD",
						"overscan": {
							"bottom": 0,
							"left": 0,
							"right": 0,
							"top": 0
						},
						"rotation": 0,
						"workArea": {
							"height": 1032,
							"left": -1920,
							"top": 0,
							"width": 1920
						}
					}
				],
				"multimonitor": [{
						"bounds": {
							"height": 1080,
							"left": 0,
							"top": 0,
							"width": 1920
						},
						"dpiX": 168.16551208496094,
						"dpiY": 168.16551208496094,
						"hasTouchSupport": true,
						"id": "13761487533244416",
						"isEnabled": true,
						"isInternal": true,
						"isPrimary": true,
						"mirroringSourceId": "",
						"modes": [{
								"deviceScaleFactor": 1.25,
								"height": 540,
								"heightInNativePixels": 1080,
								"isNative": false,
								"isSelected": false,
								"uiScale": 0.5,
								"width": 960,
								"widthInNativePixels": 1920
							}, {
								"deviceScaleFactor": 1.25,
								"height": 675,
								"heightInNativePixels": 1080,
								"isNative": false,
								"isSelected": false,
								"uiScale": 0.625,
								"width": 1200,
								"widthInNativePixels": 1920
							}, {
								"deviceScaleFactor": 1.25,
								"height": 864,
								"heightInNativePixels": 1080,
								"isNative": false,
								"isSelected": false,
								"uiScale": 0.800000011920929,
								"width": 1536,
								"widthInNativePixels": 1920
							}, {
								"deviceScaleFactor": 1.25,
								"height": 1080,
								"heightInNativePixels": 1080,
								"isNative": true,
								"isSelected": true,
								"uiScale": 1,
								"width": 1920,
								"widthInNativePixels": 1920
							}, {
								"deviceScaleFactor": 1.25,
								"height": 1350,
								"heightInNativePixels": 1080,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1.25,
								"width": 2400,
								"widthInNativePixels": 1920
							}
						],
						"name": "Internal Display",
						"overscan": {
							"bottom": 0,
							"left": 0,
							"right": 0,
							"top": 0
						},
						"rotation": 0,
						"workArea": {
							"height": 1032,
							"left": 0,
							"top": 0,
							"width": 1920
						}
					}, {
						"bounds": {
							"height": 1080,
							"left": 1920,
							"top": 0,
							"width": 1920
						},
						"dpiX": 101.5999984741211,
						"dpiY": 101.5999984741211,
						"hasTouchSupport": false,
						"id": "2764161111015425",
						"isEnabled": true,
						"isInternal": false,
						"isPrimary": false,
						"mirroringSourceId": "",
						"modes": [{
								"deviceScaleFactor": 1,
								"height": 400,
								"heightInNativePixels": 400,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 720,
								"widthInNativePixels": 720
							}, {
								"deviceScaleFactor": 1,
								"height": 480,
								"heightInNativePixels": 480,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 640,
								"widthInNativePixels": 640
							}, {
								"deviceScaleFactor": 1,
								"height": 480,
								"heightInNativePixels": 480,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 720,
								"widthInNativePixels": 720
							}, {
								"deviceScaleFactor": 1,
								"height": 600,
								"heightInNativePixels": 600,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 800,
								"widthInNativePixels": 800
							}, {
								"deviceScaleFactor": 1,
								"height": 624,
								"heightInNativePixels": 624,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 832,
								"widthInNativePixels": 832
							}, {
								"deviceScaleFactor": 1,
								"height": 576,
								"heightInNativePixels": 576,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1024,
								"widthInNativePixels": 1024
							}, {
								"deviceScaleFactor": 1,
								"height": 768,
								"heightInNativePixels": 768,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1024,
								"widthInNativePixels": 1024
							}, {
								"deviceScaleFactor": 1,
								"height": 720,
								"heightInNativePixels": 720,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1280,
								"widthInNativePixels": 1280
							}, {
								"deviceScaleFactor": 1,
								"height": 864,
								"heightInNativePixels": 864,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1152,
								"widthInNativePixels": 1152
							}, {
								"deviceScaleFactor": 1,
								"height": 800,
								"heightInNativePixels": 800,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1280,
								"widthInNativePixels": 1280
							}, {
								"deviceScaleFactor": 1,
								"height": 960,
								"heightInNativePixels": 960,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1280,
								"widthInNativePixels": 1280
							}, {
								"deviceScaleFactor": 1,
								"height": 1024,
								"heightInNativePixels": 1024,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1280,
								"widthInNativePixels": 1280
							}, {
								"deviceScaleFactor": 1,
								"height": 900,
								"heightInNativePixels": 900,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1600,
								"widthInNativePixels": 1600
							}, {
								"deviceScaleFactor": 1,
								"height": 1050,
								"heightInNativePixels": 1050,
								"isNative": false,
								"isSelected": false,
								"uiScale": 1,
								"width": 1680,
								"widthInNativePixels": 1680
							}, {
								"deviceScaleFactor": 1,
								"height": 1080,
								"heightInNativePixels": 1080,
								"isNative": true,
								"isSelected": true,
								"uiScale": 1,
								"width": 1920,
								"widthInNativePixels": 1920
							}
						],
						"name": "BenQG2222HDAL",
						"overscan": {
							"bottom": 0,
							"left": 0,
							"right": 0,
							"top": 0
						},
						"rotation": 0,
						"workArea": {
							"height": 1032,
							"left": 1920,
							"top": 0,
							"width": 1920
						}
					}
				],
				"singleMonitor": {
					"displayInfo": [{
							"bounds": {
								"height": 864,
								"left": 0,
								"top": 0,
								"width": 1536
							},
							"dpiX": 133.1549530029297,
							"dpiY": 133.1549530029297,
							"id": "0",
							"isEnabled": true,
							"isInternal": true,
							"isPrimary": true,
							"mirroringSourceId": "",
							"name": "Internal Display",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 816,
								"left": 0,
								"top": 0,
								"width": 1536
							}
						}
					],
					"screen": {
						"width": 1536,
						"height": 864,
						"availWidth": 1536,
						"availHeight": 816,
						"availLeft": 0,
						"availTop": 0
					},
					"window": {
						"devicePixelRatio": 1.25
					}
				},
				"chekedSpanDisplayMultiMonitor": {
					"displayInfo": [{
							"bounds": {
								"height": 1080,
								"left": 0,
								"top": 0,
								"width": 1920
							},
							"dpiX": 166.4436798095703,
							"dpiY": 166.4436798095703,
							"id": "0",
							"isEnabled": true,
							"isInternal": true,
							"isPrimary": true,
							"mirroringSourceId": "",
							"name": "Internal Display",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 1080,
								"left": 0,
								"top": 0,
								"width": 1920
							}
						}, {
							"bounds": {
								"height": 1080,
								"left": 1920,
								"top": 0,
								"width": 1920
							},
							"dpiX": 101.5999984741211,
							"dpiY": 101.5999984741211,
							"id": "2763893501653249",
							"isEnabled": true,
							"isInternal": false,
							"isPrimary": false,
							"mirroringSourceId": "",
							"name": "BenQ G2220HD",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 1080,
								"left": 1920,
								"top": 0,
								"width": 1920
							}
						}
					],
					"screen": {
						"width": 3072,
						"height": 864,
						"availWidth": 3072,
						"availHeight": 816,
						"availLeft": 0,
						"availTop": 0
					},
					"window": {
						"devicePixelRatio": 1.25
					}
				},
				"unChekedSpanDisplayMultiMonitor": {
					"displayInfo": [{
							"bounds": {
								"height": 864,
								"left": 0,
								"top": 0,
								"width": 1536
							},
							"dpiX": 133.1549530029297,
							"dpiY": 133.1549530029297,
							"id": "0",
							"isEnabled": true,
							"isInternal": true,
							"isPrimary": true,
							"mirroringSourceId": "",
							"name": "Internal Display",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 816,
								"left": 0,
								"top": 0,
								"width": 1536
							}
						}, {
							"bounds": {
								"height": 1080,
								"left": 1536,
								"top": 0,
								"width": 1920
							},
							"dpiX": 101.5999984741211,
							"dpiY": 101.5999984741211,
							"id": "2763893501653249",
							"isEnabled": true,
							"isInternal": false,
							"isPrimary": false,
							"mirroringSourceId": "",
							"name": "BenQ G2220HD",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 1032,
								"left": 1536,
								"top": 0,
								"width": 1920
							}
						}
					],
					"screen": {
						"width": 1536,
						"height": 864,
						"availWidth": 1536,
						"availHeight": 816,
						"availLeft": 0,
						"availTop": 0
					},
					"window": {
						"devicePixelRatio": 1.25
					}
				}
			},
			"0_changed": {
				"singleMonitor": {
					"displayInfo": [{
							"bounds": {
								"height": 864,
								"left": 0,
								"top": 0,
								"width": 1536
							},
							"dpiX": 133.1549530029297,
							"dpiY": 133.1549530029297,
							"id": "0",
							"isEnabled": true,
							"isInternal": true,
							"isPrimary": true,
							"mirroringSourceId": "",
							"name": "Internal Display",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 864,
								"left": 0,
								"top": 0,
								"width": 1536
							}
						}
					],
					"screen": {
						"width": 1536,
						"height": 864,
						"availWidth": 1536,
						"availHeight": 816,
						"availLeft": 0,
						"availTop": 0
					},
					"window": {
						"devicePixelRatio": 1.25
					}
				},
				"chekedSpanDisplayMultiMonitor": {
					"displayInfo": [{
							"bounds": {
								"height": 1080,
								"left": 0,
								"top": 0,
								"width": 1920
							},
							"dpiX": 166.4436798095703,
							"dpiY": 166.4436798095703,
							"id": "0",
							"isEnabled": true,
							"isInternal": true,
							"isPrimary": true,
							"mirroringSourceId": "",
							"name": "Internal Display",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 1080,
								"left": 0,
								"top": 0,
								"width": 1920
							}
						}, {
							"bounds": {
								"height": 1080,
								"left": 1920,
								"top": 0,
								"width": 1920
							},
							"dpiX": 101.5999984741211,
							"dpiY": 101.5999984741211,
							"id": "2763893501653249",
							"isEnabled": true,
							"isInternal": false,
							"isPrimary": false,
							"mirroringSourceId": "",
							"name": "BenQ G2220HD",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 1080,
								"left": 1920,
								"top": 0,
								"width": 1920
							}
						}
					],
					"screen": {
						"width": 3072,
						"height": 864,
						"availWidth": 3072,
						"availHeight": 816,
						"availLeft": 0,
						"availTop": 0
					},
					"window": {
						"devicePixelRatio": 1.25
					}
				},
				"unChekedSpanDisplayMultiMonitor": {
					"displayInfo": [{
							"bounds": {
								"height": 864,
								"left": 0,
								"top": 0,
								"width": 1536
							},
							"dpiX": 133.1549530029297,
							"dpiY": 133.1549530029297,
							"id": "0",
							"isEnabled": true,
							"isInternal": true,
							"isPrimary": true,
							"mirroringSourceId": "",
							"name": "Internal Display",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 864,
								"left": 0,
								"top": 0,
								"width": 1536
							}
						}, {
							"bounds": {
								"height": 1080,
								"left": 1536,
								"top": 0,
								"width": 1920
							},
							"dpiX": 101.5999984741211,
							"dpiY": 101.5999984741211,
							"id": "2763893501653249",
							"isEnabled": true,
							"isInternal": false,
							"isPrimary": false,
							"mirroringSourceId": "",
							"name": "BenQ G2220HD",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 1032,
								"left": 1536,
								"top": 0,
								"width": 1920
							}
						}
					],
					"screen": {
						"width": 1536,
						"height": 864,
						"availWidth": 1536,
						"availHeight": 816,
						"availLeft": 0,
						"availTop": 0
					},
					"window": {
						"devicePixelRatio": 1.25
					}
				}
			},
			"0_changed": {
				'singleMonitor': {
					displayInfo: [{
							"bounds": {
								"height": 864,
								"left": 0,
								"top": 0,
								"width": 1536
							},
							"dpiX": 133.1549530029297,
							"dpiY": 133.1549530029297,
							"id": "0",
							"isEnabled": true,
							"isInternal": true,
							"isPrimary": true,
							"mirroringSourceId": "",
							"name": "Internal Display",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 864,
								"left": 0,
								"top": 0,
								"width": 1536
							}
						}
					],
					screen: {
						width: 1536,
						height: 864,
						availWidth: 1536,
						availHeight: 816,
						availLeft: 0,
						availTop: 0

					},
					window: {
						devicePixelRatio: 1.25
					}
				},
				'chekedSpanDisplayMultiMonitor': {
					displayInfo: [{
							"bounds": {
								"height": 1080,
								"left": 0,
								"top": 0,
								"width": 1920
							},
							"dpiX": 166.4436798095703,
							"dpiY": 166.4436798095703,
							"id": "0",
							"isEnabled": true,
							"isInternal": true,
							"isPrimary": true,
							"mirroringSourceId": "",
							"name": "Internal Display",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 1080,
								"left": 0,
								"top": 0,
								"width": 1920
							}
						}, {
							"bounds": {
								"height": 1080,
								"left": 1920,
								"top": 0,
								"width": 1920
							},
							"dpiX": 101.5999984741211,
							"dpiY": 101.5999984741211,
							"id": "2763893501653249",
							"isEnabled": true,
							"isInternal": false,
							"isPrimary": false,
							"mirroringSourceId": "",
							"name": "BenQ G2220HD",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 1080,
								"left": 1920,
								"top": 0,
								"width": 1920
							}
						}
					],
					screen: {
						width: 3072,
						height: 864,
						availWidth: 3072,
						availHeight: 816,
						availLeft: 0,
						availTop: 0

					},
					window: {
						devicePixelRatio: 1.25
					}
				},
				'unChekedSpanDisplayMultiMonitor': {
					displayInfo: [{
							"bounds": {
								"height": 864,
								"left": 0,
								"top": 0,
								"width": 1536
							},
							"dpiX": 133.1549530029297,
							"dpiY": 133.1549530029297,
							"id": "0",
							"isEnabled": true,
							"isInternal": true,
							"isPrimary": true,
							"mirroringSourceId": "",
							"name": "Internal Display",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 864,
								"left": 0,
								"top": 0,
								"width": 1536
							}
						}, {
							"bounds": {
								"height": 1080,
								"left": 1536,
								"top": 0,
								"width": 1920
							},
							"dpiX": 101.5999984741211,
							"dpiY": 101.5999984741211,
							"id": "2763893501653249",
							"isEnabled": true,
							"isInternal": false,
							"isPrimary": false,
							"mirroringSourceId": "",
							"name": "BenQ G2220HD",
							"overscan": {
								"bottom": 0,
								"left": 0,
								"right": 0,
								"top": 0
							},
							"rotation": 0,
							"workArea": {
								"height": 1032,
								"left": 1536,
								"top": 0,
								"width": 1920
							}
						}
					],
					screen: {
						width: 1536,
						height: 864,
						availWidth: 1536,
						availHeight: 816,
						availLeft: 0,
						availTop: 0

					},
					window: {
						devicePixelRatio: 1.25
					}
				}

			}

		};
		var boundChangeByUnitTest = true;
		var constants = {};
		var uniqueId = 1;
		constants.systemDisplayChange = 1;
		var eventListeners = {};
		var config = {};
		config.currentMode = "singleMonitor";
		config.unifiedModeDataIndex = 0;
		var originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

		var windowScreen = window.screen;
		var currentScreen = windowScreen;
		/*
		 * make screen valriable proper for unified desktop mode in proper way
		 */
		function ConfigChange() {}

		Object.defineProperties(ConfigChange.prototype, {
			changeDisplay: {
				set: function (afterCallback) {
					setTimeout(function () {
						window.screen = displayInfoArr[config.unifiedModeDataIndex][config.currentMode].screen;
						mockWindow.devicePixelRatio = displayInfoArr[config.unifiedModeDataIndex][config.currentMode].window.devicePixelRatio;
						callEventCallback(constants.systemDisplayChange);
						afterCallback();
					}, 100);

				},
				enumerable: true,
				configurable: true
			}
		});
		config.modeChange = new ConfigChange();

		var boundChangeTimer;
		var boundChangeTime = 100;

		var currentWindowInfo = {
			outerBounds: {
				left: 0,
				top: 0,
				width: 0,
				height: 0
			},
			innerBounds: {
				left: 0,
				top: 0,
				width: 1536,
				height: 864
			},
			window: {
				outerBounds: {
					left: 0,
					top: 0,
					width: 0,
					height: 0
				},
				innerBounds: {
					left: 0,
					top: 0,
					width: 1536,
					height: 864
				}
			}
		};

		var mockWindow = jasmine.createSpyObj('window', ['addEventListener', 'screen', 'system', 'chrome', 'isMinimized', 'isFullscreen']);
		function setBoundChangeTimer() {
			clearTimeout(boundChangeTimer);
			boundChangeTimer = setTimeout(function () {
					callEventCallback('resize', {});
				});

		}

		var Window1 = function () {};
		Object.defineProperties(Window1.prototype, {

			innerWidth: {
				get: function () {
					return currentWindowInfo.window.innerBounds.width;
				},
				set: function (value) {
					currentWindowInfo.window.innerBounds.width = value;
					currentWindowInfo.innerBounds.width = value;
					mockWindow.innerWidth = value;
					setBoundChangeTimer();
				},
				enumerable: true,
				configurable: true
			},
			innerHeight: {
				get: function () {
					return currentWindowInfo.window.innerBounds.height;
				},
				set: function (value) {
					currentWindowInfo.window.innerBounds.height = value;
					currentWindowInfo.innerBounds.height = value;
					mockWindow.innerHeight = value;
					setBoundChangeTimer();
				},
				enumerable: true,
				configurable: true
			},
			outerWidth: {
				get: function () {
					return currentWindowInfo.window.outerBounds.width;
				},
				set: function (value) {
					currentWindowInfo.window.outerBounds.width = value;
					currentWindowInfo.outerBounds.width = value;
					mockWindow.outerWidth = value;
					setBoundChangeTimer();
				},
				enumerable: true,
				configurable: true
			},
			outerHeight: {
				get: function () {
					return currentWindowInfo.window.outerBounds.height;
				},
				set: function (value) {
					currentWindowInfo.window.outerBounds.height = value;
					currentWindowInfo.outerBounds.height = value;
					mockWindow.outerHeight = value;
					setBoundChangeTimer();
				},
				enumerable: true,
				configurable: true
			}
		});
		mockWindow.window = new Window1();

		mockWindow.addEventListener.and.callFake(function (evtType, callback) {
			if (!eventListeners[evtType]) {
				eventListeners[evtType] = [];
			}
			callback.__ID = uniqueId++;
			eventListeners[evtType].push(callback);
		});

		var mockChromeAPI = jasmine.createSpyObj('chrome', ['app', 'onBoundsChanged']);

		mockChromeAPI.onBoundsChanged = jasmine.createSpyObj('onBoundsChanged', ['addListener', 'removeListener']);
		mockChromeAPI.onBoundsChanged.addListener.and.callFake(function (callback) {
			if (!eventListeners["resize"]) {
				eventListeners["resize"] = [];
			}
			callback.__ID = uniqueId++;
			eventListeners["resize"].push(callback);
		});

		mockChromeAPI.onBoundsChanged.removeListener.and.callFake(function (callback) {
			var callbacks = eventListeners[resize];
			if (callbacks) {
				var len = callbacks.length;
				for (var i = len - 1; i >= 0; i--) {
					if (callback.__ID == callbacks[i].__ID)
						callbacks.splice(i, 1);
				}
			}
		});
		var isMinimized = false;

		mockChromeAPI.isMinimized = function () {
			return isMinimized;
		};

		mockChromeAPI.app = jasmine.createSpyObj('mockChromeAPI.app', ['window']);
		mockChromeAPI.app.window = jasmine.createSpyObj('mockChromeAPI.app.window', ['current']);

		mockChromeAPI.app.window.current.and.callFake(function (callback) {
			return mockChromeAPI;
		});

		var storageObj = jasmine.createSpyObj('storage', ['local']);
		mockChromeAPI.storage = storageObj;
		var getObj = jasmine.createSpyObj('local', ['get', 'set']);
		storageObj.local = getObj;

		getObj.get.and.callFake(function (callback) {
			//setTimeout(callback(displayInfoArr[config.unifiedModeDataIndex][config.currentMode].displayInfo), 10);
		});

		getObj.set.and.callFake(function (callback) {
			//setTimeout(callback(displayInfoArr[config.unifiedModeDataIndex][config.currentMode].displayInfo), 10);
		});

		var isFullScreen = false;
		mockChromeAPI.isFullscreen = function () {
			return isFullScreen;
		};

		mockWindow.chrome = mockChromeAPI;

		var outerBoundsFn = function () {};
		Object.defineProperties(outerBoundsFn.prototype, {
			left: {
				get: function () {
					return currentWindowInfo.outerBounds.left;
				},
				set: function (value) {
					currentWindowInfo.window.outerBounds.left = value;
					currentWindowInfo.outerBounds.left = value;
					if (g.environment.receiver.seamlessMode == true) {
						currentWindowInfo.window.innerBounds.left = currentWindowInfo.window.outerBounds.left;
						currentWindowInfo.innerBounds.left = currentWindowInfo.outerBounds.left;
					}
					setBoundChangeTimer();

				},
				enumerable: true,
				configurable: true
			},
			top: {
				get: function () {
					return currentWindowInfo.outerBounds.top;
				},
				set: function (value) {

					currentWindowInfo.window.outerBounds.top = value;
					currentWindowInfo.outerBounds.top = value;
					if (g.environment.receiver.seamlessMode == true) {
						currentWindowInfo.window.innerBounds.top = currentWindowInfo.window.outerBounds.top;
						currentWindowInfo.innerBounds.top = currentWindowInfo.outerBounds.top;
					}
					setBoundChangeTimer();
				},
				enumerable: true,
				configurable: true
			},
			width: {
				get: function () {
					return currentWindowInfo.outerBounds.width;
				},
				set: function (value) {
					currentWindowInfo.window.outerBounds.width = value;
					currentWindowInfo.outerBounds.width = value;
					if (g.environment.receiver.seamlessMode == true) {
						currentWindowInfo.window.innerBounds.width = currentWindowInfo.window.outerBounds.width;
						currentWindowInfo.innerBounds.width = currentWindowInfo.outerBounds.width;
					}
					setBoundChangeTimer();
				},
				enumerable: true,
				configurable: true
			},
			height: {
				get: function () {
					return currentWindowInfo.outerBounds.height;
				},
				set: function (value) {
					currentWindowInfo.window.outerBounds.height = value;
					currentWindowInfo.outerBounds.height = value;
					if (g.environment.receiver.seamlessMode == true) {
						currentWindowInfo.innerBounds.height = currentWindowInfo.outerBounds.height;
						currentWindowInfo.window.innerBounds.height = currentWindowInfo.window.outerBounds.height;
					}
					setBoundChangeTimer();
				},
				enumerable: true,
				configurable: true
			}
		});
		mockChromeAPI.outerBounds = new outerBoundsFn();

		var innerBoundsFn = function () {};

		Object.defineProperties(innerBoundsFn.prototype, {
			left: {
				get: function () {
					return currentWindowInfo.innerBounds.left;
				},
				set: function (value) {
					currentWindowInfo.window.innerBounds.left = value;
					currentWindowInfo.innerBounds.left = value;

					if (g.environment.receiver.seamlessMode == true) {
						currentWindowInfo.window.outerBounds.left = currentWindowInfo.window.innerBounds.left;
						currentWindowInfo.outerBounds.left = currentWindowInfo.innerBounds.left;
					}
					setBoundChangeTimer();

				},
				enumerable: true,
				configurable: true
			},
			top: {
				get: function () {
					return currentWindowInfo.innerBounds.top;
				},
				set: function (value) {
					currentWindowInfo.window.innerBounds.top = value;
					currentWindowInfo.innerBounds.top = value;
					if (g.environment.receiver.seamlessMode == true) {
						currentWindowInfo.window.outerBounds.top = currentWindowInfo.window.innerBounds.top;
						currentWindowInfo.outerBounds.top = currentWindowInfo.innerBounds.top;
					}
					setBoundChangeTimer();
				},
				enumerable: true,
				configurable: true
			},
			width: {
				get: function () {
					return currentWindowInfo.innerBounds.width;
				},
				set: function (value) {
					currentWindowInfo.window.innerBounds.width = value;
					currentWindowInfo.innerBounds.width = value;
					if (g.environment.receiver.seamlessMode == true) {
						currentWindowInfo.outerBounds.width = currentWindowInfo.innerBounds.width;
						currentWindowInfo.window.outerBounds.width = currentWindowInfo.window.innerBounds.width;
					}
					setBoundChangeTimer();
				},
				enumerable: true,
				configurable: true
			},
			height: {
				get: function () {
					return currentWindowInfo.innerBounds.height;
				},
				set: function (value) {
					currentWindowInfo.window.innerBounds.height = value;
					currentWindowInfo.innerBounds.height = value;
					if (g.environment.receiver.seamlessMode == true) {
						currentWindowInfo.outerBounds.height = currentWindowInfo.innerBounds.height;
						currentWindowInfo.window.outerBounds.height = currentWindowInfo.window.innerBounds.height;
					}
					setBoundChangeTimer();
				},
				enumerable: true,

				configurable: true
			}
		});

		mockChromeAPI.innerBounds = new innerBoundsFn();

		var systemObj = jasmine.createSpyObj('system', ['display']);
		mockChromeAPI.system = systemObj;
		var displayObj = jasmine.createSpyObj('display', ['getInfo', 'onDisplayChanged']);

		displayObj.getInfo.and.callFake(function (callback) {
			setTimeout(callback(displayInfoArr[config.unifiedModeDataIndex][config.currentMode].displayInfo), 10);
		});
		mockChromeAPI.system.display = displayObj;
		var onDisplayChangedObj = jasmine.createSpyObj('onDisplayChanged', ['addListener']);

		onDisplayChangedObj.addListener.and.callFake(function (callback) {
			var evtType = constants.systemDisplayChange;
			console.log("regidtrying diplay change");
			if (!eventListeners[evtType]) {
				eventListeners[evtType] = [];
			}
			eventListeners[evtType].push(callback);
		});
		mockChromeAPI.system.display.onDisplayChanged = onDisplayChangedObj;
		var browserId;

		var info = {
			'normalWindow': {
				'resolutionInfo': {
					'bounds': {
						innerWidth: 1920,
						innerHeight: 940,
						outerWidth: 1920,
						outerHeight: 1040,

					},
					'devicePixelRatio': 1
				},

				'zoomed_resolutionInfo': {
					'bounds': {
						innerWidth: 1280,
						innerHeight: 627,
						outerWidth: 1920,
						outerHeight: 1040,

					},
					'devicePixelRatio': 1.5
				}
			},
			'resizedWindow': {
				'resolutionInfo': {
					'bounds': {
						innerWidth: 790,
						innerHeight: 436,
						outerWidth: 800,
						outerHeight: 558,
						left: 0,
						top: 0
					},
					'devicePixelRatio': 1
				},
				'zoomed_resolutionInfo': {
					'bounds': {
						innerWidth: 527,
						innerHeight: 291,
						outerWidth: 800,
						outerHeight: 558,

					},
					'devicePixelRatio': 1.5
				}
			},
		};
		function setBrowserSpecificData(winbounds) {
			g.environment.window = mockWindow;
			if (browserInfo.userAgent)
				g.environment.navigator.userAgent = browserInfo.userAgent;
			if (browserInfo.appVersion) {
				g.environment.navigator.appVersion = browserInfo.appVersion;
			}
			if (browserInfo.isTouchOS)
				g.environment.os.isTouch = browserInfo.isTouchOS;
			if (browserInfo.orientation)
				mockWindow.screen[browserInfo.orientation.key] = browserInfo.orientation.value;

			browserId = "(browser = " + g.environment.browser.name + ", os = " + g.environment.os.name + ", receiver = " + g.environment.receiver.name;
			if (browserInfo.deviceType) {
				browserId += ", device=" + browserInfo.deviceType;
			}
			browserId += ")";

			if (winbounds) {
				currentWindowInfo.innerBounds.width = winbounds.bounds.innerWidth;
				currentWindowInfo.innerBounds.height = winbounds.bounds.innerHeight;
				currentWindowInfo.outerBounds.width = winbounds.bounds.outerWidth;
				currentWindowInfo.outerBounds.height = winbounds.bounds.outerHeight;

				currentWindowInfo.window.innerBounds.width = winbounds.bounds.innerWidth;
				currentWindowInfo.window.innerBounds.height = winbounds.bounds.innerHeight;
				currentWindowInfo.window.outerBounds.width = winbounds.bounds.outerWidth;
				currentWindowInfo.window.outerBounds.height = winbounds.bounds.outerHeight;

				mockWindow.innerWidth = winbounds.bounds.innerWidth;
				mockWindow.innerHeight = winbounds.bounds.innerHeight;
				mockWindow.outerWidth = winbounds.bounds.outerWidth;
				mockWindow.outerHeight = winbounds.bounds.outerHeight;
			}
			mockWindow.devicePixelRatio = 1.0;
			window.screen = windowScreen;

		}

		setBrowserSpecificData();
		function resetBrowserSpecificData() {
			g.environment.window = window;
			g.environment.navigator.userAgent = navigator.userAgent;
			g.environment.receiver.seamlessMode = false;
			window.screen = windowScreen;
			jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
		}

		describe("Resolution Utility Common Unit test:", function () {
			beforeEach(function () {
				setBrowserSpecificData();
				resolutionActivityInstance = UiControls.ResolutionUtility.getNewInstance({
						window: mockWindow,
						chrome: mockChromeAPI
					});
				resolutionActivityInstance.init(displayInfoArr[0].singleMonitor.displayInfo);

			});
			afterEach(function () {
				resetBrowserSpecificData();

			});
			it('Odd width and height test', function () {
				var oddData = {
					width: 1001,
					height: 999,
					alwaysSend: true
				};
				var evenData = {
					width: 1000,
					height: 998
				}
				var callbackObj = {};
				callbackObj['callback'] = function (args) {
					expect(args.width).toEqual(evenData.width);
					expect(args.height).toEqual(evenData.height);
				};
				resolutionActivityInstance.registerCallback(UiControls.ResolutionUtility.constants.sessionResize, callbackObj['callback']);
				resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, oddData);
			});

			it('Preffered resolution is set on session launch', function () {
				var prefRes = '1050x600';
				var preferredRes = {
					width: 1050,
					height: 600
				}
				resolutionActivityInstance.init(displayInfoArr[0].singleMonitor.displayInfo, prefRes);
				var callbackObj = {};
				callbackObj['callback'] = function (args) {
					expect(args.width).toEqual(preferredRes.width);
					expect(args.height).toEqual(preferredRes.height);
				};
				resolutionActivityInstance.get(UiControls.ResolutionUtility.constants.sessionResize, callbackObj['callback']);
			});

			it('isFullscreen is set to true on session launch', function () {
				resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.fullScreen, 'fullscreen');
				var callbackObj = function (args) {
					expect(args.isFullScreen).toEqual(true);
					expect(args.monitorCount).toEqual(1);
				};
				resolutionActivityInstance.get(UiControls.ResolutionUtility.constants.displayInformation, callbackObj);

			});

		});

		describe("Resolution Utility Multimonitor test:", function () {
			beforeEach(function () {
				setBrowserSpecificData();
				resolutionActivityInstance = UiControls.ResolutionUtility.getNewInstance({
						window: mockWindow,
						chrome: mockChromeAPI
					});
				isFullScreen = true;
				resolutionActivityInstance.init(displayInfoArr[0].multimonitor);

			});
			afterEach(function () {
				resetBrowserSpecificData();

			});

			it('checking for monitorCount', function () {
				var callbackObj = {};
				callbackObj['callback'] = function (args) {
					expect(args.monitorCount).toEqual(2);
				};
				resolutionActivityInstance.get(UiControls.ResolutionUtility.constants.displayInformation, callbackObj['callback']);
			});

			it('checking for primary monitor', function () {
				var callbackObj = {};
				callbackObj['callback'] = function (args) {
					expect(args.primaryMonitor).toEqual(0);
				};
				resolutionActivityInstance.get(UiControls.ResolutionUtility.constants.displayInformation, callbackObj['callback']);
			});

			it('checking for boundary', function () {
				var callbackObj = {};
				callbackObj['callback'] = function (args) {
					expect(args.boundary.right).toEqual(expectedBoundary.right);
					expect(args.boundary.bottom).toEqual(expectedBoundary.bottom);
				};
				resolutionActivityInstance.get(UiControls.ResolutionUtility.constants.displayInformation, callbackObj['callback']);
			});

		});

		describe("Resolution Utility Multimonitor test (negative co-ordinates):", function () {
			beforeEach(function () {
				setBrowserSpecificData();
				mockChromeAPI['isFullscreen'] = function () {
					return true;
				}
				resolutionActivityInstance = UiControls.ResolutionUtility.getNewInstance({
						window: mockWindow,
						chrome: mockChromeAPI
					});
				isFullScreen = true;
				HTML5_CONFIG['features']['graphics']['multiMonitor'] = true;
				resolutionActivityInstance.init(displayInfoArr[0].mm_negative);

			});
			afterEach(function () {
				resetBrowserSpecificData();

			});

			it('checking for multimonitor variable', function () {
				var callbackObj = {};
				callbackObj['callback'] = function (args) {
					expect(args.multimonitor).toEqual(true);
				};
				resolutionActivityInstance.get(UiControls.ResolutionUtility.constants.displayInformation, callbackObj['callback']);
			});

			it('checking for primary monitor', function () {
				var callbackObj = {};
				callbackObj['callback'] = function (args) {
					expect(args.primaryMonitor).toEqual(1);
				};
				resolutionActivityInstance.get(UiControls.ResolutionUtility.constants.displayInformation, callbackObj['callback']);
			});

			it('checking for boundary', function () {
				var callbackObj = {};
				callbackObj['callback'] = function (args) {
					expect(args.boundary.right).toEqual(expectedBoundary.right);
					expect(args.boundary.bottom).toEqual(expectedBoundary.bottom);
				};
				resolutionActivityInstance.get(UiControls.ResolutionUtility.constants.displayInformation, callbackObj['callback']);
			});

		});

		describe("Resolution Utility Multimonitor test (disabling use all my monitors)", function () {
			beforeEach(function () {
				setBrowserSpecificData();
				HTML5_CONFIG['features']['graphics']['multiMonitor'] = false;
				resolutionActivityInstance = UiControls.ResolutionUtility.getNewInstance({
						window: mockWindow,
						chrome: mockChromeAPI
					});
				isFullScreen = true;
				resolutionActivityInstance.init(displayInfoArr[0].mm_negative);

			});
			afterEach(function () {
				resetBrowserSpecificData();
				HTML5_CONFIG['features']['graphics']['multiMonitor'] = true;
			});

			it('expecting multimonitor to be false', function () {
				var callbackObj = {};
				callbackObj['callback'] = function (args) {
					expect(args.multimonitor).toEqual(false);
				};
				resolutionActivityInstance.get(UiControls.ResolutionUtility.constants.displayInformation, callbackObj['callback']);
			});

		});

		resetBrowserSpecificData();
	}

	var chromeOs = [];

	chromeOs[chromeOs.length] = {
		appVersion: "5.0 (X11; CrOS x86_64 7978.66.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.91 Safari/537.36",
		orientation: {
			'key': 'orientation',
			'value': {
				angle: 0,
				type: "landscape-primary"
			}
		},
		browser: 'chrome',
		userAgent: "Mozilla/5.0 (X11; CrOS x86_64 7978.66.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.91 Safari/537.36"
	};

	for (var i = 0; i < chromeOs.length; i++) {
		executeTestCase(chromeOs[i]);
	}

})();
