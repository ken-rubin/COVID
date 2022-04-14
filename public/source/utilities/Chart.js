////////////////////////////
// Chart of covid data.
//

class Chart {

    constructor(data) {

        this.data = data;
        this.createdAt = new Date().getTime();
        this.scaleInDuration = 750;
    }

    lerp(percent, start, end) {

        return end * percent + 
            start * (1.0 - percent);
    }

    render(context) {

        try {

            // Fade in over the scane in duration....
            let fadeInPercent = (new Date().getTime() - this.createdAt) / this.scaleInDuration;
            if (fadeInPercent > 1) {

                fadeInPercent = 1;
            }

            // Define chart bounds and attributes.
            this.windowWidth = window.innerWidth;
            this.windowHeight = window.innerHeight;

            this.chartLeft = this.windowWidth * this.lerp(fadeInPercent, 0.5, 0.1);
            this.chartTop = this.windowHeight * 0.05;
            this.chartWidth = this.windowWidth * this.lerp(fadeInPercent, 0.0, 0.8);
            this.chartHeight = this.windowHeight * this.lerp(fadeInPercent, 0.0, 0.4);

            this.titleLeft = this.chartWidth * 0.004;
            this.titleTop = this.chartHeight * 0.005;
            this.titleWidth = this.chartWidth * 0.992;
            this.titleHeight = this.chartHeight * 0.12;

            this.barsLeft = this.titleLeft;
            this.barsTop = 5 * this.titleTop + this.titleHeight;
            this.barsWidth = this.titleWidth;
            this.barsHeight = this.chartHeight * (1.0 - 10 * 0.005 - 0.12) * fadeInPercent;

            this.titleFont = `${this.titleHeight.toFixed(2) * 0.85}px Arial`;

            // Background.
            context.fillStyle = "rgba(0,0,0,0.4)";
            context.fillRect(this.chartLeft, 
                this.chartTop, 
                this.chartWidth, 
                this.chartHeight);

            // Title.
            context.fillStyle = "rgba(255,255,255,0.75)";
            context.fillRect(this.chartLeft + this.titleLeft, 
                this.chartTop + this.titleTop, 
                this.titleWidth, 
                this.titleHeight);
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.fillStyle = "black";
            context.font = this.titleFont;
            context.fillText(`${this.data.country}`, 
                this.chartLeft + this.titleLeft + this.titleWidth / 2, 
                this.chartTop + this.titleTop + this.titleHeight / 2 + 1,
                this.titleWidth);

            //////////////
            // Draw bars.

            // Figure out how many bars.
            const dates = Object.keys(this.data.dates);
            const barCount = dates.length;
            const barWidth = this.barsWidth / barCount;
            
            // Draw the bars.
            for (let i = 0; i < dates.length; i++) {

                const aDate = this.data.dates[dates[i]];
                const datePercent = aDate * fadeInPercent / this.data.maxValue;

                context.fillStyle = `rgba(100,100, 100,${(1 - fadeInPercent)})`;
                context.fillRect(this.chartLeft + this.barsLeft + barWidth * (i + 0.15),
                    this.chartTop + this.barsTop,
                    barWidth * 0.7,
                    this.barsHeight);

                context.fillStyle = `rgba(255,255,255,${fadeInPercent * 0.75})`;
                context.fillRect(this.chartLeft + this.barsLeft + barWidth * (i + 0.15),
                    this.chartTop + this.barsTop + this.barsHeight * (1 - datePercent),
                    barWidth * 0.7,
                    this.barsHeight * datePercent);
                context.strokeStyle = `rgba(50,0,0,${fadeInPercent / 2.0})`;
                context.beginPath();
                context.rect(this.chartLeft + this.barsLeft + barWidth * (i + 0.15),
                    this.chartTop + this.barsTop + this.barsHeight * (1 - datePercent),
                    barWidth * 0.7,
                    this.barsHeight * datePercent);
                context.lineWidth = 0.5;
                context.stroke();
            }

        } catch (x) {

            alert(x.message);
        }
    }
}