dojo.require("dojox.gfx");
//dojo.require("dojox.gfx.move");
function getInternetExplorerVersion() {
// Returns the version of Internet Explorer or a -1
// (indicating the use of another browser).
// Kids, don't ever browser sniff at home
  var rv = -1; // Return value assumes failure.
  if (navigator.appName == 'Microsoft Internet Explorer') {
    var ua = navigator.userAgent;
    var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  return rv;
}
function parseSD(sdf) {
  var lookupelem = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb','Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es'];
  
  var lines = sdf.split("\n");
  var Natoms = parseFloat(lines[3].substring(0, 3));
  var Nbonds = parseFloat(lines[3].substring(3, 6));

  var atoms = Array(Natoms);
  var elements = Array(Natoms);

  for (var i=4;i<Natoms+4;i++) {
    var x = parseFloat(lines[i].substring(0, 10));
    var y = parseFloat(lines[i].substring(10, 20));
    var z = parseFloat(lines[i].substring(20, 30));
    var e = lines[i].substring(30, 32);
    // This next line was replaced with a better catch-all.
    //if (e.substring(0,1)==" ") e = e.substring(1);
    e = e.replace(/^\s+|\s+$/g, '')
    atoms[i-4] = [x, y, z];
    for(var j=0; j<lookupelem.length; j++){
        if(lookupelem[j]==e){
            elements[i-4] = j+1;
            break;
        }
    }
  }
  var bonds = Array(Nbonds);
  for (i=4 + Natoms;i<(Nbonds+Natoms+4);i++) {
    var s = parseFloat(lines[i].substring(0, 3)) - 1;
    var e = parseFloat(lines[i].substring(3, 6)) - 1;
    bonds[i-4-Natoms] = [s, e];
  }
  var molecule = {atoms: atoms, bonds: bonds, elements: elements};
  return molecule;
}
function tl_createBonds(p) {
  var start;
  var end;
  for(var i=0; i< p.bonds.length; i++) {
    start = p.bonds[i][0];
    end = p.bonds[i][1];
    p.lines[i] = p.surface.createLine({x1:0, y1:0, x2:1, y2:0})
                         .setFill([0, 0, 0, 1]).setStroke({color:[0,0,0,1], width:0.05});
  }
}
function tl_drawBonds(p) {
  var start;
  var end;
  var len;
  var dx;
  var dy;
  for(var i=0; i< p.bonds.length; i++) {
    start = p.bonds[i][0];
    end = p.bonds[i][1];
    p.lines[i].setShape({x1:p.coords[start][0] * p.scale + p.centre.x,
		         y1:p.coords[start][1] * p.scale + p.centre.y,
			 x2:p.coords[end][0] * p.scale + p.centre.x,
			 y2:p.coords[end][1] * p.scale + p.centre.y})
	      .setStroke({width:p.scale / 10});
  }
}
function tl_createShadows(p) {
  for(var i=0;i<p.coords.length;i++) {
    var radius = 6;
    if (p.elements[i]==1) radius = radius / 2;
    p.shadows[i] = p.surface.createEllipse({cx: 0, cy: 0,
                                            rx: radius, ry: radius / 3})
				.setFill([180, 180, 180, 1]);
  }
}
function tl_createAtoms(p) {
  for(var i=0;i<p.coords.length;i++) {
    var col = tl_CPK[p.elements[i]];
    var radius = 10; // Using a radius < 1 causes an error in IE
    if (p.elements[i]==1) radius = radius / 2;

    p.spheres[i] = p.surface.createGroup();
    p.spheres[i].createCircle({cx: 0, cy: 0, r: radius})
				.setFill([col[0], col[1], col[2], 1]);
    if (p.elements[i]!=1) p.spheres[i].createCircle({cx: - 2, cy: -3, r: radius * 0.1})
				.setFill([255, 255, 255, 1]);
  }
}
function tl_zorder(a, b) {
	var x = a.depth;
	var y = b.depth;
	return ((x < y) ? 1 : ((x > y) ? -1 : 0));
}
function tl_drawAtoms(p) {
  // Z-Order
	var temp = Array(p.coords.length);
	for (var i=0;i<p.coords.length;i++)
	 	temp[i] = {idx: i, depth: p.coords[i][2]};
	temp.sort(tl_zorder);

  var scale = p.scale * 0.05;

	for (i=0; i<p.coords.length;i++) {
		var max = temp[i].idx;
    p.spheres[max].setTransform({dx: p.centre.x + p.coords[max][0] * p.scale, dy: p.centre.y + p.coords[max][1] * p.scale, xx:scale , yy:scale}).moveToFront();
	}
}
function tl_drawShadows(p) {
  var y;
  var alpha;
  var size;
  var scale = p.scale * 0.1;
  for(var i=0; i < p.coords.length; i++) {
    y = p.coords[i][1];
    alpha = 0.6;
    size = scale;
    if(y<0) {
      alpha = alpha + y * 0.3;
      size = (1-y) * scale;
      if(alpha<0) alpha=0;
    }
    p.shadows[i].setTransform({dx: p.coords[i][0] * p.scale + p.centre.x, dy: (p.coords[i][2] /5 + p.range*0.75) * p.scale + p.centre.y, xx:size, yy:size}).setFill([180, 180, 180, alpha]);
  }
}
var tl_mouse = {left:0, right:2, middle: 1};
if (getInternetExplorerVersion()!=-1) tl_mouse = {left:1, right:2, middle: 4};
tl_onContextMenu = function(evt){
   evt.stopPropagation();
   evt.preventDefault();
   dojo.stopEvent(evt);
}
tl_onMouseDown = function(evt){
   var p = this.p;
   p.mymousedown = evt.button;
   p.dragorigin = [evt.clientX - p.container_pos.x, evt.clientY - p.container_pos.y];
   p.anglesorigin = [p.angles[0], p.angles[1], p.angles[2]];
   p.zoomorigin = p.scale;
   evt.stopPropagation();
   evt.preventDefault();
   dojo.stopEvent(evt);
};
tl_onMouseUp = function(evt){
  var p = this.p;
  p.mymousedown = -1;
  p.angles = [0, 0, 0];
  for(var i=0;i<p.atoms.length;i++) {
    var c = p.coords[i];
    p.atoms[i] = [c[0], c[1], c[2]];
  }
};
tl_onMouseMove = function(evt){
   var p = this.p;
   evt.stopPropagation();
   evt.preventDefault();
   dojo.stopEvent(evt);
   if (p.mymousedown==-1) return;
   var mx = evt.clientX - p.container_pos.x;
   var my = evt.clientY - p.container_pos.y;
   if (p.mymousedown == tl_mouse.left) {
     p.angles[0] = p.anglesorigin[0] + (my - p.dragorigin[1])/(p.height / 5);
     p.angles[1] = p.anglesorigin[1] + (mx - p.dragorigin[0])/(p.width / 5);
   }
   else if (p.mymousedown == tl_mouse.middle) {
     p.centre.x = p.width/2 + mx - p.dragorigin[0];
     p.centre.y = p.height/2 + my - p.dragorigin[1];
   }
   else if (p.mymousedown == tl_mouse.right) {
     p.scale = p.zoomorigin + (p.dragorigin[1] - my) / (p.height / 25);
     p.angles[2] = p.anglesorigin[2] + (- p.dragorigin[0] + mx)/(p.width / 5);
   }
   tl_draw(p);
};
function tl_draw(p) {
   tl_rotateAround(p);
   tl_drawShadows(p);
   tl_drawBonds(p);
   tl_drawAtoms(p);
}
function tl_centreMol(p) {
  var size = p.width;
  if (p.height<size) size = p.height;
  var mean = [0, 0, 0];
  var min = [999999, 999999, 999999];
  var max = [-999999, -999999, -999999];
  for(i=0; i < p.atoms.length; i++) {
    for(var j=0;j<3;j++) {
       mean[j] += p.atoms[i][j];
       if (p.atoms[i][j] < min[j]) min[j]=p.atoms[i][j];
       if (p.atoms[i][j] > max[j]) max[j]=p.atoms[i][j];
    }
  }
  var maxrange = -999999;
  for(j=0;j<3;j++) {
    mean[j] = mean[j] / p.atoms.length;
    if(max[j]-min[j] > maxrange) maxrange = max[j] - min[j];
  }
  var scale = size * 7.6 / (240 * maxrange); 
  for(i=0; i < p.atoms.length; i++) {
    for(j=0;j<3;j++) {
      p.atoms[i][j] = p.atoms[i][j] - mean[j];
    }
  }
  return {scale: scale, range: maxrange};
}
function tl_rotateAround(p) {
  // Rotate around X
  c = Math.cos(p.angles[0]);
  s = Math.sin(p.angles[0]);
  for (var i=0;i<p.atoms.length;i++) {
    p.coords[i][0] = p.atoms[i][0];
    p.coords[i][1] = p.atoms[i][1] * c - p.atoms[i][2] * s;
    p.coords[i][2] = p.atoms[i][1] * s + p.atoms[i][2] * c;
  }
  // Rotate around Y
  c = Math.cos(p.angles[1]);
  s = Math.sin(p.angles[1]);
  for (i=0;i<p.atoms.length;i++) {
    t = p.coords[i][0] * c - p.coords[i][2] * s;
    u = p.coords[i][0] * s + p.coords[i][2] * c;
    p.coords[i][0] = t;
    p.coords[i][2] = u;
  }
  // Rotate around Z
  c = Math.cos(p.angles[2]);
  s = Math.sin(p.angles[2]);
  for (i=0;i<p.atoms.length;i++) {
    t = p.coords[i][0] * c - p.coords[i][1] * s;
    u = p.coords[i][0] * s + p.coords[i][1] * c;
    p.coords[i][0] = t;
    p.coords[i][1] = u;
  }
}
var tl_CPK = [[-1,-1,-1], [255,255,255], [217,255,255] , [204,128,255], [194,255,0], [255,181,181], [144,144,144], [48,80,248], [255,13,13], [144,224,80], [179,227,245], [171,92,242], [138,255,0], [191,166,166], [240,200,160], [255,128,0], [255,255,48], [31,240,31], [128,209,227], [143,64,212], [61,255,0], [230,230,230], [191,194,199], [166,166,171], [138,153,199], [156,122,199], [224,102,51], [240,144,160], [80,208,80], [200,128,51], [125,128,176], [194,143,143], [102,143,143], [189,128,227], [255,161,0], [166,41,41], [92,184,209], [112,46,176], [0,255,0], [148,255,255], [148,224,224], [115,194,201], [84,181,181], [59,158,158], [36,143,143], [10,125,140], [0,105,133], [192,192,192], [255,217,143], [166,117,115], [102,128,128], [158,99,181], [212,122,0], [148,0,148], [66,158,176], [87,23,143], [0,201,0], [112,212,255], [255,255,199], [217,255,199], [199,255,199], [163,255,199], [143,255,199], [97,255,199], [69,255,199], [48,255,199], [31,255,199], [0,255,156], [0,230,117], [0,212,82], [0,191,56], [0,171,36], [77,194,255], [77,166,255], [33,148,214], [38,125,171], [38,102,150], [23,84,135], [208,208,224], [255,209,35], [184,184,208], [166,84,77], [87,89,97], [158,79,181], [171,92,0], [117,79,69], [66,130,150], [66,0,102], [0,125,0], [112,171,250], [0,186,255], [0,161,255], [0,143,255], [0,128,255], [0,107,255], [84,92,242], [120,92,227], [138,79,227], [161,54,212], [179,31,212], [179,31,186], [179,13,166], [189,13,135], [199,0,102], [204,0,89], [209,0,79], [217,0,69], [224,0,56], [230,0,46], [235,0,38]]; // 