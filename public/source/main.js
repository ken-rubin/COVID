/////////////////////////////////
// Main client-side entry-point.
//

// Wire event handler to wait for start of page before executing script code.
document.addEventListener("DOMContentLoaded", () => {

    try {

        post('/data', { 

            answer: 42 
        }).then((data) => {

            const dates = Object.keys(data[0].dates);

            // Get max value.
            let maxValue = 0;
            data.forEach((item) => {

                const itemValue = item.dates[dates[dates.length - 1]];
                item.logValue = Math.log(itemValue);
                if (item.logValue > maxValue) {

                    maxValue = item.logValue;
                }
            });

            const width = 800;
            const height = 800;

            const center = [width / 2.0, height / 2.0];

          	const config = {

                speed: 0.01,
                verticalTilt: -30,
                horizontalTilt: 0
            };
            const svg = d3.select('svg');
            const markerGroup = svg.append('g');
            const projection = d3.geoOrthographic(); // geoInterruptedHomolosine geoVanDerGrinten4 geoSinusoidal geoPolyconic geoNicolosi geoMollweide geoMiller geoLarrivee geoHealpix geoGuyou geoGringorten geoEisenlohr geoNaturalEarth1 geoTransverseMercator geoMercator geoEquirectangular geoConicEqualArea geoConicConformal geoAzimuthalEqualArea geoAzimuthalEquidistant geoGnomonic geoStereographic
            projection.translate(center);
            projection.scale(300);
            const path = d3.geoPath().projection(projection);

            drawGlobe();    
            drawGraticule();
            enableRotation();    

            function drawGlobe() {  
                d3.queue()
                    .defer(d3.json, 'https://gist.githubusercontent.com/mbostock/4090846/raw/d534aba169207548a8a3d670c9c2cc719ff05c47/world-110m.json')          
                    .await((error, worldData) => {
                        svg.selectAll(".segment")
                            .data(topojson.feature(worldData, worldData.objects.countries).features)
                            .enter()
                                .append("path")
                                .attr("class", "segment")
                                .attr("d", path)
                                .style("stroke", "#eee")
                                .style("stroke-width", "1px")
                                .style("fill", (d, i) => '#222')
                                .style("opacity", ".25");
                            drawMarkers();                   
                    });
            }

            function drawGraticule() {
                const graticule = d3.geoGraticule()
                    .step([10, 10]);

                svg.append("path")
                    .datum(graticule)
                    .attr("class", "graticule")
                    .attr("d", path)
                    .style("fill", "#fff")
                    .style("stroke", "#ccc");
            }

            function enableRotation() {

                d3.timer((elapsed) => {

                    projection.rotate([config.speed * elapsed, config.verticalTilt, config.horizontalTilt]);
                    svg.selectAll("path").attr("d", path);
                    drawMarkers();
                });
            }        

            function drawMarkers() {

                const markers = markerGroup.selectAll('circle')
                    .data(data);
                markers
                    .enter()
                    .append('circle')
                    .on("pointerdown", (d) => {

                        alert("on click" + d.Long);
                    })
                    .merge(markers)
                    .attr('cx', (d) => {

                        return projection([d.Long, d.Lat])[0]
                    })
                    .attr('cy', (d) => {

                        return projection([d.Long, d.Lat])[1]
                    })
                    .attr('fill', (d) => {

                        const coordinate = [d.Long, d.Lat];
                        gdistance = d3.geoDistance(coordinate, projection.invert(center));
                        return gdistance > Math.PI / 2.0 ? 'none' : 'rgba(96,0,0,0.75)';
                    })
                    .attr('r', (d) => {

                        const coordinate = [d.Long, d.Lat];
                        const gdistance = d3.geoDistance(coordinate, projection.invert(center));
                        const distPercent = 1.0 - (gdistance / (Math.PI / 2.0)) * 0.95;

                        const percent = (d.logValue / maxValue) * distPercent ;
                        return Math.max(percent * 24, 0);
                    });

                markerGroup.each(function () {
                    
                    this.parentNode.appendChild(this);
                });
            }

            // .
            let downPoint = null;
            const startInteraction = (event) => {

                event.target.setPointerCapture(event.pointerId);

                if (event.changedTouches && event.changedTouches.length) {

                    downPoint = {

                        x: event.changedTouches[0].clientX,
                        y: event.changedTouches[0].clientX,
                        horizontalTilt: config.horizontalTilt,
                        verticalTilt: config.verticalTilt
                    };
                } else {

                    downPoint = {

                        x: event.clientX,
                        y: event.clientY,
                        horizontalTilt: config.horizontalTilt,
                        verticalTilt: config.verticalTilt
                    };
                }
                event.preventDefault();
            };
            const endInteraction = (event) => {

                downPoint = null;
                event.preventDefault();
            };
            const moveInteraction = (event) => {

                if (downPoint) {

                    let deltaX = 0;
                    let deltaY = 0;
                    if (event.changedTouches && event.changedTouches.length) {

                        deltaX = (event.changedTouches[0].clientX - downPoint.x);
                        deltaY = (event.changedTouches[0].clientY - downPoint.y);
                    } else {

                        deltaX = (event.clientX - downPoint.x);
                        deltaY = (event.clientY - downPoint.y);
                    }

                    config.horizontalTilt = downPoint.horizontalTilt + deltaX / 1.0;
                    config.verticalTilt = downPoint.verticalTilt - deltaY / 1.0;
                }
                event.preventDefault();
            };

            // .
            document.addEventListener("pointerdown", startInteraction);

            document.addEventListener("pointermove", moveInteraction);

            document.addEventListener("pointerup", endInteraction);
            document.addEventListener("pointercancel", endInteraction);
            document.addEventListener("pointerout", endInteraction);
            document.addEventListener("pointerleave", endInteraction);
        });
    } catch (x) {

        alert(x.message);
    }
});