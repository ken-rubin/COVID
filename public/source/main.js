/////////////////////////////////
// Main client-side entry-point.
//

// Wire event handler to wait for start of page before executing script code.
document.addEventListener("DOMContentLoaded", () => {

    try {

        var width = 0;
        var height = 0;
        var center = [0,0];
        var sourceRotation = null;
        var targetRotation = null;
        var targetRotationSetTime = null;
        var targetRotationInterpolateTime = 500;
        var chart = null;
        var baseScale = null;
        var sourceScale = null;
        var targetScale = null;
        var targetScaleSetTime = null;
        var targetScaleInterpolateTime = 1000;
        var scaleCookie = null;
        var scaleResetTime = 2500;
        var zoomInScaleFactor = 10;
        var baseZoomFactor = 0.9

        var sphere = {
            
            type: 'Sphere'
        };
        var graticule = d3.geoGraticule();

        // set up the main canvas and the projection 
        var canvas = d3.select('body').append('canvas');
        var context = canvas.node().getContext('2d');

        var projection = d3.geoOrthographic()
            .clipAngle(90);

        var path = d3.geoPath()
            .projection(projection)
            .context(context)
            .pointRadius(1);

        const load = (error, data, world) => {

            if (error) { 
                
                console.log(error); 
                return; 
            }

            // The dates keys is the collection of dates for which there is data.
            const dates = Object.keys(data[0].dates);

            // Get max value across all dates.
            let maxValue = 0;
            data.forEach((item) => {

                // The last date is always the highest.
                const itemValue = item.dates[dates[dates.length - 1]];

                // Take the log because ...Hubei....
                item.logValue = Math.log(itemValue);
                item.maxValue = itemValue;

                // Remember the max.
                if (item.logValue > maxValue) {

                    maxValue = item.logValue;
                }
            });

            var land = topojson.feature(world, world.objects.countries);
            var grid = graticule();

            // Draw the world.
            const drawWorld = () => {

                context.clearRect(0, 0, width, height);

                context.beginPath(); 
                path(sphere);
                context.lineWidth = 1;
                context.strokeStyle = '#0cc';
                context.stroke();

                context.beginPath();
                path(grid);
                context.lineWidth = .5;
                context.strokeStyle = '#ddd';
                context.stroke();

                context.beginPath();
                path(land);
                context.fillStyle = '#ccc';
                context.fill();

                context.lineWidth = .5;
                context.strokeStyle = '#fff';
                context.stroke();

                data.forEach((datum) => {

                    const coordinate = [datum.Long, datum.Lat];
                    const gdistance = d3.geoDistance(coordinate, projection.invert(center));
                    if (gdistance < Math.PI / 2.0) {

                        const distPercent = 1.0 - (gdistance / (Math.PI / 2.0)) * 0.95;
                        const pixelCoordinates = projection([datum.Long, datum.Lat]);

                        let theValue = datum.logValue;
                        if (theValue === -Infinity || 
                            theValue === Infinity ||
                            isNaN(theValue)) {

                            theValue = 0.0;
                        }

                        const scale = projection.scale();
                        const percent = (theValue / maxValue) * distPercent;
                        if (isNaN(percent)) {

                            return 0;
                        }

                        var radius = Math.max(percent * 16 * (scale / 250), 0);
                        if (chart && datum === chart.data) {

                            context.fillStyle = "rgba(196, 196, 0, 1";
                        } else {

                            context.fillStyle = "rgba(96, 0, 0, 0.25";
                        }

                        context.beginPath();
                        context.arc(pixelCoordinates[0], pixelCoordinates[1], 
                            radius, 
                            2 * Math.PI, false);
                        context.fill()
                    }
                });

                // Draw chart.
                if (chart) {

                    chart.render(context);
                }
            }   // drawWorld

            const handleResize = () => {

                const element = document.body;
                const rect = element.getBoundingClientRect(); // get the bounding rectangle
                width = rect.width;
                height = rect.height;
                center[0] = width / 2;
                center[1] = height / 2;

                canvas.attr("width", width).attr("height", height);

                projection.translate(center);
                projection.scale(Math.min(center[0] * baseZoomFactor, 
                    center[1] * baseZoomFactor));
                baseScale = projection.scale();
            };
            window.addEventListener("resize", handleResize);
            handleResize();

            const rotateSlowly = () => {

                let rotate = projection.rotate();
                if (targetRotation) {

                    // Get percent across the transition.
                    const ms = (new Date().getTime() - targetRotationSetTime);
                    let percent = ms / targetRotationInterpolateTime;
                    let rotateNew = null;
                    if (percent >= 1) {

                        rotateNew = targetRotation;
                        targetRotation = null;
                    } else {

                        const usePercent = Math.sin(Math.PI / 2.0 * percent);
                        rotateNew = [

                            targetRotation[0] * usePercent + sourceRotation[0] * (1.0 - usePercent),
                            targetRotation[1] * usePercent + sourceRotation[1] * (1.0 - usePercent),
                            targetRotation[2] * usePercent + sourceRotation[2] * (1.0 - usePercent)
                        ];
                    }
                    projection.rotate(rotateNew);
                } else if (projection.scale() === baseScale) {

                    let rotateNew = [rotate[0] + 0.03, rotate[1], rotate[2]];
                    projection.rotate(rotateNew);
                }

                // Scale too.
                if (targetScale) {

                    // Get percent across the transition.
                    const ms = (new Date().getTime() - targetScaleSetTime);
                    let percent = ms / targetScaleInterpolateTime;
                    let scaleNew = null;
                    if (percent >= 1) {

                        scaleNew = targetScale;
                        targetScale = null;
                    } else {

                        const usePercent = Math.sin(Math.PI / 2.0 * percent);
                        scaleNew = targetScale * usePercent + sourceScale * (1.0 - usePercent);
                    }
                    projection.scale(scaleNew);
                }

                drawWorld();
                requestAnimationFrame(rotateSlowly);
            }
            rotateSlowly();

            // Process dragging.
            let v0, q0, r0;

            const dragstarted = () => {
        
                v0 = versor.cartesian(projection.invert([d3.event.x, d3.event.y]));
                q0 = versor(r0 = projection.rotate());
            };

            const dragged = () => {

                const v1 = versor.cartesian(projection.rotate(r0).invert([d3.event.x, d3.event.y]));
                const q1 = versor.multiply(q0, versor.delta(v0, v1));
                projection.rotate(versor.rotation(q1));
            };

            canvas.call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged));

            canvas.node().addEventListener("click", (event) => {

                // Toggle off the chart, if already allocated.
                if (chart) {

                    chart = null;
                    return;
                }

                // Get where the cursor is.
                var pixelCoordinates = [event.clientX, event.clientY];

                // Figure out if inside the sphere.
                var dist = Math.sqrt(Math.pow(pixelCoordinates[0] - center[0], 2) + 
                    Math.pow(pixelCoordinates[1] - center[1], 2));                
                var scale = projection.scale();
                if (dist < scale) {

                    // Cast to {long, lat}.
                    var globeCoordinates = projection.invert(pixelCoordinates);

                    // Pick the nearest dot.
                    let minimumDistance = Infinity;
                    data.forEach((item) => {

                        // Calculate the distance from the dot to the click.
                        const distanceToClick = Math.sqrt(Math.pow(globeCoordinates[0] - item.Long, 2) + 
                            Math.pow(globeCoordinates[1] - item.Lat, 2));
                        if (distanceToClick < minimumDistance) {

                            minimumDistance = distanceToClick;
                            chart = new Chart(item);
                        }
                    });
                    if (chart) {

                        globeCoordinates = [chart.data.Long, chart.data.Lat];
                    }

                    sourceRotation = projection.rotate();
                    targetRotation = [-globeCoordinates[0], -globeCoordinates[1], 0];

                    // Don't wrap around the whole world.
                    if (sourceRotation[0] - targetRotation[0] > 180) {

                        targetRotation = [360 - globeCoordinates[0], -globeCoordinates[1], 0];
                    }

                    targetRotationSetTime = new Date().getTime();

                    //////////////////////////////
                    // Now set up target scaling.

                    // First, have to cancel any pending scale reduction.
                    if (scaleCookie) {

                        clearTimeout(scaleCookie);
                        scaleCookie = null;
                    }

                    // Now, set the "return to base" scale timeout.
                    scaleCookie = setTimeout(() => {

                        sourceScale = projection.scale();
                        targetScale = baseScale;
                        targetScaleSetTime = new Date().getTime();
                    }, scaleResetTime);

                    // Now, set the "zoom in" scale.
                    sourceScale = projection.scale();
                    targetScale = baseScale * zoomInScaleFactor;
                    targetScaleSetTime = new Date().getTime();
                }
            });

            // Zing.
            var myRegion = new ZingTouch.Region(canvas.node());
            myRegion.bind(canvas.node(), 'expand', function(e) {
            
            	console.log('Expand gesture emitted: ' + e.detail.change);
            });
            myRegion.bind(canvas.node(), 'pinch', function(e) {
            
            	console.log('Pinch gesture emitted: ' + e.detail.change);
            });
            myRegion.bind(canvas.node(), 'tap', function(e) {
            
            	console.log('Tap gesture emitted: ' + e.detail.interval);
            });

        }   // load.

        // Get data, start up simulation.
        d3.queue()
            .defer(d3.json, '/data')
            .defer(d3.json, '/geo.json')
            .await(load);
    } catch (x) {

        alert(x.message);
    }
});
