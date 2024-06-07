let currTraces = {};
let currDay = 1;

async function readDay(dayNum) {
    const day_data = await readCSV(dayNum);
    const columns = parseCSV(day_data);

    currDay = dayNum;

    updateTraces(columns);

    console.log(columns['crash_record'])

    const crashIndices = [];
    columns['crash_record'].forEach((value, index) => {
        if (value == 1) {
            crashIndices.push(index);
        }
    });

    crashTimes = new Set(crashIndices.map(index => columns['time'][index]));

    const manualAnomalyIndices = [];
    columns['human_label'].forEach((value, index) => {
        if (value == 1) {
            manualAnomalyIndices.push(index);
        }
    });

    manualTimes = new Set(manualAnomalyIndices.map(index => columns['time'][index]));

    // Getting times crashes were reported for plotting
    return [crashTimes, manualTimes];
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
        result = await readDay(day_num);
        crashTimes = result[0];
        manualTimes = result[1];
        console.log("done reading")
    }

    const crashLines = [];
    let hasCrash = false;
    for (const crashTime of crashTimes) {
        line = {
            type: 'line',
            x0: crashTime,   // x position of the vertical line
            y0: 53,   // start y position of the vertical line
            x1: crashTime,   // end x position of the vertical line
            y1: 70.5,  // end y position of the vertical line
            line: {
                color: 'purple',
                width: 2,
                dash: 'dashdot',
            },
            name: 'Crash Reported', 
            showlegend: !hasCrash ? true : false
        }
        
        crashLines.push(line);
        hasCrash = true;
    }

    let hasManual = false;
    for (const manualTime of manualTimes) {
        line = {
            type: 'line',
            x0: manualTime,   // x position of the vertical line
            y0: 53,   // start y position of the vertical line
            x1: manualTime,   // end x position of the vertical line
            y1: 70.5,  // end y position of the vertical line
            line: {
                color: 'yellow',
                width: 1,
                dash: 'dashdot',
            },
            name: 'Human Annotated Anomaly',  
            showlegend: !hasManual ? true : false,
        }

        crashLines.push(line);
    }

    const legendItems = [
        { name: 'Crash Reported', color: 'purple', dash: 'dashdot' },
        { name: 'Human Annotated Anomaly', color: 'yellow', dash: 'dashdot' }
    ];

    // Define layout for the plot
    const layout = {
        title: feature.charAt(0).toUpperCase() + feature.slice(1) + " in Lane " + lane.charAt(lane.length - 1),
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
        responsive: true,
        shapes: crashLines,
        legend: {
            
            traceorder: 'normal',
            font: {
                family: 'Arial, sans-serif',
                size: 12,
                color: 'black'
            },
            bgcolor: 'rgba(0,0,0,0)', // Transparent background
            bordercolor: 'rgba(255,255,255,0.3)', // Border color for legend
            borderwidth: 1, // Border width for legend
            itemsizing: 'constant', // Keep legend items the same size
            itemclick: false, // Allow toggling visibility by clicking on legend items
            x: 0, // Position legend on the left
            xanchor: 'left', // Anchor legend to the left
            y: -0.1, // Position legend at the top
            yanchor: 'top', // Anchor legend to the top
            title: {
                text: '',
                font: {
                    family: 'Arial, sans-serif',
                    size: 14,
                    color: 'white'
                }
            },
            orientation: "h"
        },
        showlegend: true
    };
    

    // Plot the scatter plot
    Plotly.newPlot('plot', [currTraces[feature][lane]], layout);
}

function updateTraces(data) {
    currTraces = {};

    const features = ['speed', 'occ', 'volume'];
    const lanes = ['lane1', 'lane2', 'lane3', 'lane4'];
    const featureRanges = {
        'speed': 90,
        'occ': 100,
        'volume': 30
    }

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
                    cmin: 0,
                    cmax: featureRanges[feature_name]
                },
                type: 'scattergl',
                hovertemplate: '<b>Time</b>: %{x|%H:%M:%S}<br>' + 
                         '<b>Milemarker</b>: %{y}<br>' +
                         `<b>${feature_name}</b>: %{marker.color:.2f} ${feature_unit[feature_name]}<extra></extra>`,
                showlegend: false
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