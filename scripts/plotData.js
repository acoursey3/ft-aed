let currTraces = {};
let currDay = 1;

async function readDay(dayNum) {
    const day_data = await readCSV(dayNum);
    const columns = parseCSV(day_data);

    currDay = dayNum;

    updateTraces(columns);
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

async function plotDay(day_num, feature, lane) {

    if(day_num != currDay || Object.keys(currTraces).length === 0) {
        console.log("reading data")
        await readDay(day_num);
        console.log("done reading")
    }

    // Define layout for the plot
    const layout = {
        title: feature,
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
            l: 80, // Adjusting left margin to create space
            r: 50, // Adjusting right margin
            b: 50, // Adjusting bottom margin
            t: 50, // Adjusting top margin to reduce distance between title and plot
            pad: 4 // Padding between plot area and the edge of the plot
        },
        responsive: true
    };
    

    // Plot the scatter plot
    Plotly.newPlot('plot', [currTraces[feature][lane]], layout);
}

function updateTraces(data) {
    currTraces = {};

    const features = ['speed', 'occ', 'volume'];
    const lanes = ['lane1', 'lane2', 'lane3', 'lane4'];

    const feature_unit = {
        'speed': 'mph',
        'occ': '%',
        'volume': ''
    }

    dates = data.time.map(date => new Date(date));

    xData = dates; //dates.map(date => date.getHours());
    yData = data.milemarker.map(parseFloat);

    

    for(let i=0; i<features.length; i++) {
        feature_name = features[i]
        currTraces[feature_name] = {};
        
        let colorScale = [
            [0, 'rgb(200, 0, 0)'],    // Dark red at 0
            [1, 'rgb(0, 200, 0)']     // Light green at 80
        ];

        if(feature_name=='occ' || feature_name=='volume') {
            colorScale = [
                [0, 'rgb(0, 200, 0)'],    // Dark red at 0
                [1, 'rgb(200, 0, 0)']     // Light green at 80
            ];
        }

        for(let j=0; j<lanes.length; j++) {
            lane_name = lanes[j];
            colorData = data[lane_name + "_" + feature_name];

            const trace = { // make and save these for speed occupancy and volume of any lane, just have to regenerate when day is changed
                x: xData,
                y: yData,
                mode: 'markers',
                marker: {
                    color: colorData,
                    colorbar: {
                        title: feature_name, // Add color bar title
                        ticksuffix: feature_unit[feature_name] // Add unit to color bar ticks
                    },
                    size: 2, // Set marker size
                    colorscale: colorScale,
                },
                type: 'scattergl',
                hovertemplate: '<b>Time</b>: %{x|%H:%M:%S}<br>' + 
                         '<b>Milemarker</b>: %{y}<br>' +
                         `<b>${feature_name}</b>: %{marker.color:.2f} ${feature_unit[feature_name]}<extra></extra>`
            };

            currTraces[feature_name][lane_name] = trace;
        }
    }
}

function updatePlot() {
    const featureDropdown = document.getElementById("feature-dropdown");
    const laneDropdown = document.getElementById("lane-dropdown");
    const dayDropdown = document.getElementById("day-dropdown");

    const selectedFeature = featureDropdown.options[featureDropdown.selectedIndex].value;
    const selectedLane = laneDropdown.options[laneDropdown.selectedIndex].value;
    const selectedDay = dayDropdown.options[dayDropdown.selectedIndex].value;

    plotDay(parseInt(selectedDay), selectedFeature, selectedLane);
}

plotDay(1, 'speed', 'lane1')