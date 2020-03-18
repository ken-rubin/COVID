/////////////////////////////////
// Main client-side entry-point.
//

// Wire event handler to wait for start of page before executing script code.
document.addEventListener("DOMContentLoaded", () => {

    try {

        // Grab references to the input fields.
        const rotationLambda = document.getElementById("rotationLambda");
        const rotationPhi = document.getElementById("rotationPhi");
        const rotationGamma = document.getElementById("rotationGamma");
        const scaleValue = document.getElementById("scaleValue");
        const projectionType = document.getElementById("projectionType");
//        const dataType = document.getElementById("dataType");

        // Get the data.
        post('/data', { 

            type: "confirmed" 
        }).then((data) => {

            // The dates keys is the collection of dates for which there is data.
            const dates = Object.keys(data[0].dates);

            // Get max value across all dates.
            let maxValue = 0;
            data.forEach((item) => {

                // The last date is always the highest.
                const itemValue = item.dates[dates[dates.length - 1]];

                // Take the log because ...Hubei....
                item.logValue = Math.log(itemValue);

                // Remember the max.
                if (item.logValue > maxValue) {

                    maxValue = item.logValue;
                }
            });

            const svg = d3.select('svg');
            let center = [0, 0];
            let projection = d3.geoOrthographic();
            let zoomFactor = 1.0;

            const handleResize = () => {

                const element = document.getElementById("globe");
                const rect = element.getBoundingClientRect(); // get the bounding rectangle
                center[0] = rect.width / 2;
                center[1] = rect.height / 2;

                projection.translate(center);
                projection.scale(Math.min(center[0] * 0.9 * zoomFactor, 
                    center[1] * 0.9 * zoomFactor));
            };

            // Wire project type input.
            projectionType.addEventListener("input", (event) => {

                // .
                svg.selectAll("*").remove();

                const projectionValue = event.target.options[event.target.selectedIndex].value;
                projection = d3[projectionValue]();
                handleResize();

                markerGroup = svg.append('g');
                path = d3.geoPath().projection(projection);
                drawGlobe();
                drawGraticule();
            });

            window.addEventListener("resize", handleResize);
            handleResize();

          	const config = {

                speed: 0.01,
                verticalTilt: -30,
                horizontalTilt: 0
            };
            let markerGroup = svg.append('g');
            let path = d3.geoPath().projection(projection);

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

                    const initialRotation = projection.rotate();
                    initialRotation[0] = config.speed * elapsed;
                    projection.rotate(initialRotation);
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

                        let theValue = d.logValue;
                        if (theValue === -Infinity || 
                            theValue === Infinity ||
                            isNaN(theValue)) {

                            theValue = 0.0;
                        }
                        const percent = (theValue / maxValue) * distPercent;
                        if (isNaN(percent)) {

                            return 0;
                        }
                        return Math.max(percent * 24 * (scaleValue.value / 100.0) * zoomFactor, 0);
                    });

                markerGroup.each(function () {
                    
                    this.parentNode.appendChild(this);
                });
            }

            let v0, q0, r0;
  
            function dragstarted() {
        
                v0 = versor.cartesian(projection.invert([d3.event.x, d3.event.y]));
                q0 = versor(r0 = projection.rotate());
            }

            function dragged() {

                const v1 = versor.cartesian(projection.rotate(r0).invert([d3.event.x, d3.event.y]));
                const q1 = versor.multiply(q0, versor.delta(v0, v1));
                projection.rotate(versor.rotation(q1));
            }

            d3.selectAll("path").call(d3.drag().on("start", dragstarted).on("drag", dragged));
            
            svg.call(d3.zoom()
                .extent([[0, 0], [center[0] * 2, center[1] * 2]])
                .scaleExtent([0.1, 8])
                .on("zoom", function () {

                    zoomFactor = d3.event.transform.k;
                    handleResize();
                }));


        });
    } catch (x) {

        alert(x.message);
    }
});