var gl;
var canvas;
var glColor;
var canvasColor;
var colorCanvas;
var vBuffer;
var cBuffer;
var pBuffer;
var count = 0;
var tool = "brush";
var brushButton;
var eraserButton;
var selectButton;
var fillShapeButton;
var selectedPoints =[];
var coordinatesToCopy = [];
var coordinatesColorToCopy = [];
var erasePoint;
var bcr;
var bcrColor;
var mouseX;
var mouseY;
var undoButton;
var redoButton;
var undoCount = 0;
var redoCount = 4;
var isDrawing = false;
var coordinates = [];
var coordinateIndices =0;
var coordinatesColor = []
var tempCoordinates = [];
var tempColor = [];
var temoColorIndice = 0;
var colorIndex = 0;
var vCol;
var currentCol = vec4( 0.0, 0.0, 0.0, 1.0 );
var newCoordinates = [];
var newCoordinatesColor = [];
var newA ;
var newB;
var colors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // cyan
    vec4( 0.5, 0.5, 0.5, 1.0 )   // grey
];

var data_hue = [
    1.0,  1.0, 1.0, 0.0, 0.0,
    -1.0,  1.0, 1.0, 0.0, 0.0,
    1.0,  0.667, 1.0, 0.0, 1.0,
    -1.0,  0.667, 1.0, 0.0, 1.0,
    1.0,  0.333, 0.0, 0.0, 1.0,
    -1.0,  0.333, 0.0, 0.0, 1.0,
    1.0,  0.0, 0.0, 1.0, 1.0,
    -1.0,  0.0, 0.0, 1.0, 1.0,
    1.0, -0.333, 0.0, 1.0, 0.0,
    -1.0, -0.333, 0.0, 1.0, 0.0,
    1.0, -0.667, 1.0, 1.0, 0.0,
    -1.0, -0.667, 1.0, 1.0, 0.0,
    1.0, -1.0, 1.0, 0.0, 0.0,
    -1.0, -1.0, 1.0, 0.0, 0.0
    
];
var data = [
    -1.0,  1.0,
    -1.0, -1.0,
     1.0,  1.0,
     1.0,  1.0,
    -1.0, -1.0,
     1.0, -1.0,
];

var hue = 0.0;
var saturation = 0.0;
var value = 0.0;
var gamma = 1.0


window.onload = function() 
{
    canvas = document.getElementById("gl-canvas"); 
    gl = canvas.getContext('webgl', {preserveDrawingBuffer: true}); 
    bcr= canvas.getBoundingClientRect(); 

    canvasColor = document.getElementById("gl-color-canvas"); 
    glColor = canvasColor.getContext('webgl', {preserveDrawingBuffer: true}); 
    bcrColor= canvasColor.getBoundingClientRect(); 

    
    glColor = WebGLUtils.setupWebGL( canvasColor );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    glColor = WebGLUtils.setupWebGL( canvasColor );
    if ( !glColor ) { alert( "WebGL isn't available" ); }

    //  Configure WebGL canvas
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );     
    gl.clear( gl.COLOR_BUFFER_BIT );

    //  Configure WebGL color canvas   
	glColor.clearColor (0.2, 0.2, 0.2, 0.0);    
    //init_colour_widget ();    
    glColor.viewport( 0, 0, canvasColor.width, canvasColor.height ); 
    glColor.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //draw_colour_widget ();
    //get_widget_colours();

    //  Load shaders and initialize attribute buffers    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" ); 
    gl.useProgram( program );

    var programColor = initShaders( glColor, "vertex-shader", "fragment-shader" ); 
    glColor.useProgram( programColor );
    
    // vertex buffer
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer); 
    gl.uniform2f(gl.getUniformLocation(program, "resolution"), canvas.width, canvas.height);
    var positionLocation = gl.getAttribLocation(program, "position"); 
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);    
    gl.enableVertexAttribArray(positionLocation);

    //color buffer
    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, coordinatesColor, gl.STATIC_DRAW );
    var vCol = gl.getAttribLocation( program, "vCol" );
    gl.vertexAttribPointer( vCol, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vCol );
    
    //color picker buffer
    pBuffer = glColor.createBuffer ();
	glColor.bindBuffer (glColor.ARRAY_BUFFER, pBuffer);
	glColor.bufferData (glColor.ARRAY_BUFFER, new Float32Array (data), gl.STATIC_DRAW);

    // Add the event listeners for selecting color
    var color_pallet = document.getElementById("color_pallet");
    color_pallet.addEventListener("click", function() 
    {
        colorIndex = color_pallet.selectedIndex;
        currentCol = vec4(colors[colorIndex]);
        console.log("Color is changed to "+ currentCol);     
    });

    var shapes = document.getElementById("shapes");
    var shapeIndex;
    var shapeType = ["triangle","rectangle","ellipse"];
    var currentShape = "triange";
    shapes.addEventListener("click", function() 
    {
        tool = "fillShape";
        shapeIndex = shapes.selectedIndex;
        currentShape = shapeType[shapeIndex];        
        selectedPoints = [];
        console.log("Selected shape to fill is "+ currentShape);     
    });

    // Add the event listeners for mousedown, mousemove, and mouseup
    canvas.addEventListener('mousedown', e => {
        isDrawing = true;             
        render(1);
 
    });
    canvas.addEventListener('mousemove', e => {        
        if (isDrawing === true && tool == "brush") {
            mouseX = e.clientX-bcr.left*2;
            mouseY = e.clientY-bcr.top*2;
            var width= 20;
	        var height=20;
            newCoordinates.push(
                [mouseX,       mouseY,
                 mouseX+width, mouseY,
                 mouseX,       mouseY+height,
                 mouseX,       mouseY+height,
                 mouseX+width, mouseY,
                 mouseX+width, mouseY+height]
            ); 

            for(var i = 0; i<6 ; i++) 
                newCoordinatesColor.push(currentCol); 

            coordinates[coordinateIndices] = [].concat.apply([], newCoordinates) ;
            coordinatesColor[coordinateIndices] = [].concat.apply([], newCoordinatesColor) ;  
            
            console.log("Drawing now ...");  
            render(0);           
        }
        if (isDrawing === true && tool == "eraser") {
            mouseX = e.clientX-bcr.left*2;
            mouseY = e.clientY-bcr.top*2;
            var width= 25;
	        var height=25;
            erasePoint = [
                mouseX,       mouseY,
                mouseX+width, mouseY,
                mouseX,       mouseY+height,
                mouseX,       mouseY+height,
                mouseX+width, mouseY,
                mouseX+width, mouseY+height];   

            for( var i = 0; i <  coordinates.length; i++){ 
                
                findAndRemove(erasePoint,coordinates[i],coordinatesColor[i]);                
                 
            }
            for( var i = 0; i <  coordinates.length; i++){ 
                
                if(coordinates[i].length == 0){
                    coordinates.splice(i,1);
                    coordinatesColor.splice(i,1 );  
                }          
                 
            }
            render(0);
             
                      
        }
    });
  
    canvas.addEventListener('mouseup', e => {
        if (isDrawing === true && tool == "brush") {
            isDrawing = false;            
            if(newCoordinates.length != 0)                
                coordinateIndices++;    
            newCoordinates = [];
            newCoordinatesColor = []; 
            redoCount=4;
            undoCount =0;
            tempCoordinates =[];
            tempColor = [];
            render(-1);
        }
        if (isDrawing === true && tool == "eraser") {
            isDrawing = false;             
            render(-1);
        }   
        if (isDrawing === true &&  tool == "select") {
            isDrawing = false;   
            if(selectedPoints.length != 8)
            {
                mouseX = e.clientX-bcr.left*2;
                mouseY = e.clientY-bcr.top*2;                
                console.log("Point ("+[mouseX,mouseY] +") is selected");
                selectedPoints.push(mouseX,mouseY);
                if(selectedPoints.length == 8){
                    console.log("Now choose a center point for copying.");                    
                }
            }
            else
            {
                mouseX = e.clientX-bcr.left*2;
                mouseY = e.clientY-bcr.top*2;
                copySelectedArea(mouseX,mouseY);
                render(0);
            } 
        
        }       
    });

     // Add the event listeners for mousedown, mousemove, and mouseup
     canvasColor.addEventListener('mousedown', e => {
        console.log("Color has been chosen.");

    });


    undoButton = document.getElementById("Undo");
     undoButton.addEventListener("click", function() {
        if(undoCount<4 && coordinates.length>0 )
        {
            undoCount++;
            redoCount--;
            console.log("undo count:" +  undoCount);
            console.log("undo done..");

            tempCoordinates.push( coordinates.pop()); 
       
            tempColor.push(coordinatesColor.pop());  
            
            coordinateIndices--;
            render(0);

        }
        else{
            
            console.log("undo cannot be done..");
        }
    });

    redoButton = document.getElementById("Redo");
    redoButton.addEventListener("click", function() {
        if(redoCount<4 && undoCount>0 )
        {
                      
            redoCount++;
            undoCount--;            
            console.log("redo count:" +  redoCount);
            console.log("redo done..");

            coordinates.push(tempCoordinates.pop()); 
          
            coordinatesColor.push(tempColor.pop());  
              
            coordinateIndices++;
            render(0);
        }
        else{
            
            console.log("redo cannot be done..");
        }
    });

    eraserButton = document.getElementById("Eraser");
    eraserButton.addEventListener("click", function() {
        if(tool != "eraser"){            
            tool = "eraser";
            console.log("Tool is changed to eraser.");
            isEraserSelected = true;
        }
    });
    brushButton = document.getElementById("Brush");
    brushButton.addEventListener("click", function() {       
        if(tool != "brush"){            
            tool = "brush";
            console.log("Tool is changed to brush.");

        }
    });

    selectButton = document.getElementById("Select");
    selectButton.addEventListener("click", function() {        
        
        selectedPoints = [];
        coordinatesToCopy = [];
        coordinatesColorToCopy = [];
        isSelectedButtonPushed = true;
        if(tool != "select"){            
            tool = "select";
            console.log("Tool is changed to select.");
        }
    });

    gl = canvas.getContext('webgl');

}

function render(mode) {
    if (0===mode ) 
    {        
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clearDepth(1.0);
        gl.viewport(0.0, 0.0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        newA = [].concat.apply([], coordinates) ;
        newB = [].concat.apply([], coordinatesColor) ;  

        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER,  flatten(newB), gl.STATIC_DRAW ); 
        
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );     
        gl.bufferData(gl.ARRAY_BUFFER, flatten(newA), gl.STATIC_DRAW);  
  
        gl.drawArrays(gl.TRIANGLES, 0, flatten(newA).length/2);
        
    }
}

// arr1 = erasePoints, arr2 = coordinates[i], arr3 = coordinatesColor[i]
function findAndRemove(arr1,arr2,arr3){
    for(var j=0; j<arr2.length ; j+=12)
    {
        if(equals(arr2.slice(j,j+12), arr1)){
            arr2.splice(j, 12);
            arr3.splice(j*2, 24);            
            console.log("Erasing now ...");             
            break;
        }
    }
}

function equals(a, b) {
    var x = ((a[0] + a[10])/2 >= b[0]) && ((a[0] + a[10])/2 >= b[4]) && ((a[0] + a[10])/2 <= b[10]) && ((a[0] + a[10])/2 <= b[2]);
    var y = ((a[1] + a[11])/2 >= b[1]) && ((a[1] + a[11])/2 <= b[5]) && ((a[1] + a[11])/2 <= b[11]) && ((a[1] + a[11])/2 >= b[3]);
    if( x && y)
        return true;

}

var loadCoordinatesFile = function(event) {
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function(){
      coordinates = JSON.parse(reader.result);
      coordinateIndices = coordinates.length;

      coordinatesCopy = JSON.parse(reader.result);
      coordinatesIndicesCopy = coordinates.length;
        
        loaded = false;
      console.log("c loaded");
    };
    reader.readAsText(input.files[0]);
};

var loadCoordinatesColorFile = function(event) {
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function(){
      coordinatesColor = JSON.parse(reader.result);
      coordinatesColorCopy = JSON.parse(reader.result);
      loaded = false;
      console.log("cc loaded");
    };
    reader.readAsText(input.files[0]);
};

var coordinatesCopy=[];
var coordinatesIndicesCopy;
var coordinatesColorCopy=[];
var loaded = false;
function loadFiles(){
    if(loaded){
        coordinates=[];
        for (var i = 0; i < coordinatesCopy.length; i++)
            coordinates[i] = coordinatesCopy[i].slice();
        
        coordinateIndices = coordinatesIndicesCopy;

        coordinatesColor=[];
        for (var i = 0; i < coordinatesColorCopy.length; i++)
            coordinatesColor[i] = coordinatesColorCopy[i].slice();

        console.log("same file");
    }
    render(0);
    loaded = true;
}

function saveCoordinatesFile() {
    var coordinatesJson = JSON.stringify(coordinates);    
      
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([coordinatesJson], {
        type: "text/plain"
    }));
    a.setAttribute("download", "coordinates.txt");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

}
function saveCoordinatesColorFile() {
    var coordinatesColorJson = JSON.stringify(coordinatesColor);    
      
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([coordinatesColorJson], {
        type: "text/plain"
    }));
    a.setAttribute("download", "coordinatesColor.txt");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

}

function copySelectedArea(mouseX,mouseY)
{
    for(var i = 0; i <coordinates.length; i++)
    {
        inside(selectedPoints ,coordinates[i],coordinatesColor[i],mouseX,mouseY);
    }

    if(coordinatesToCopy.length != 0){
        coordinates[coordinateIndices] = [].concat.apply([],coordinatesToCopy);        
        coordinatesColor[coordinateIndices] = [].concat.apply([],coordinatesColorToCopy);
        coordinateIndices++;
        console.log("Selected points are copied.");
    }
}

//a = selectedPoints , b = coordinates[i], c = coordinatesColor
var coordinatesSlice;
var coordinateColorSlice;
function inside(a, b, c, mouseX,mouseY) {
    
    var x,y;
    for(var i = 0; i <b.length; i= i+ 12)
    {
        x = (a[2] <= b[i]) && (b[i] <= a[4]) && (a[2] <= b[i+2]) && (b[i]<= a[4]);        
        y = (a[1] <= b[i+5]) &&( b[i+5]<= a[3]);
 
        if( x&&y)
        {
            coordinatesSlice = b.slice(i,i+12);
            coordinateColorSlice = c.slice(i, i+24);
            for(var k =0;k<11;k+=2)
            {
                coordinatesSlice[k] = coordinatesSlice[k] +(mouseX - a[0])             
                coordinatesSlice[k+1] = coordinatesSlice[k+1]+(mouseY - a[1])
            }

            coordinatesToCopy.push(coordinatesSlice);
            coordinatesColorToCopy.push(coordinateColorSlice);
        }
    }
}
