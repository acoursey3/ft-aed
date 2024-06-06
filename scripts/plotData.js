async function readDay(dayNum) {
    const day_data = await readCSV(dayNum);
    const columns = parseCSV(day_data);
    
    return columns;
}

async function readCSV(day_num) {
    try {
        const response = await fetch(`./day_data/day${day_num}.csv`); 
        const csvData = await response.text();

        return csvData
    } catch (error) {
        console.error('Error reading CSV file:', error);
        return null;
    }
}

function parseCSV(csv) {
    // Split the CSV data by line breaks to get rows
    const rows = csv.split('\n');
    
    // Extract column headers from the first row
    const headers = rows[0].split(',');
    
    // Initialize an empty object to store columns
    const columns = {};
    
    // Iterate through each header and initialize an empty array
    // in the columns object
    headers.forEach(header => {
        columns[header] = [];
    });
    
    // Iterate through each row (starting from index 1) and split
    // the row data into columns based on the headers
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(',');
        headers.forEach((header, index) => {
            columns[header].push(row[index]);
        });
    }
    
    return columns;
}

async function plotDay(day_num) {

    data = await readDay(day_num);
    console.log(data)

    dates = data.time.map(date => new Date(date));

    xData = dates; //dates.map(date => date.getHours());
    yData = data.milemarker.map(parseFloat);
    speedData = data.lane1_speed.map(parseFloat);
    console.log(speedData)

    var colorScale = [
        [0, 'rgb(200, 0, 0)'],    // Dark red at 0
        [1, 'rgb(0, 200, 0)']     // Light green at 80
      ];

    const trace = { // make and save these for speed occupancy and volume of any lane, just have to regenerate when day is changed
        x: xData,
        y: yData,
        mode: 'markers',
        marker: {
            color: speedData, // Color points based on speed
            // colorscale: 'RdYlGn', // Set color scale
            colorbar: {
                title: 'Speed', // Add color bar title
                ticksuffix: 'mph' // Add unit to color bar ticks
            },
            size: 2, // Set marker size
            colorscale: colorScale,
        },
        type: 'scatter',
        hovertemplate: '<b>Time</b>: %{x|%H:%M:%S}<br>' + // Format date to show only the hour
                 '<b>Milemarker</b>: %{y}<br>' +
                 '<b>Speed</b>: %{marker.color:.2f} mph<extra></extra>' // Limit speed to 2 decimal places
    };

    // Define layout for the plot
    const layout = {
        title: 'Speed Diagram',
        xaxis: {
            title: 'Time',
            showgrid: true,
            gridcolor: 'rgba(255, 255, 255, 0.3)' // Adjusting grid color for better visibility
        },
        yaxis: {
            title: 'Milemarker',
            autorange: 'reversed',
            showgrid: true,
            gridcolor: 'rgba(255, 255, 255, 0.3)' // Adjusting grid color for better visibility
        },
        plot_bgcolor: 'rgba(0, 0, 0, 1)', // Setting background color to black
        paper_bgcolor: 'rgba(0, 0, 0, 0)', // Setting paper background color to transparent
        margin: {
            autoexpand: true // Automatically expand margins to fit the plot
        }
    };
    

    // Plot the scatter plot
    Plotly.newPlot('plot', [trace], layout);
}
plotDay(1);