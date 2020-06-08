import React, {useState, useContext} from 'react';

import { makeStyles } from '@material-ui/styles';

import {Map, TileLayer, Marker, Popup, Tooltip, Circle} from 'react-leaflet';
// import { TileLayer } from 'leaflet';

import clsx from 'clsx';

import "leaflet/dist/leaflet.css";
import DataContext from './DataProvider';
import { useEffect } from 'react';

import {Fab, Typography} from "@material-ui/core";

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useRef } from 'react';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});

L.Marker.prototype.options.icon = DefaultIcon;


const useStyles = makeStyles(theme=>(
    {
        root: {
            
        },
        map: {
            position: "relative",
            zIndex: 0,
        },
        fullScreenMap: {
            height: "100vh",
            width: "100vw",
        },
        fillMap: {
            height: "100%",
            width: "100%"
        },
        fab: {
            zIndex: 100,
            margin: "10px"
        },
        fabContainer: {
            zIndex: 100,
            position: "fixed",
            bottom: "40px",
            right: "40px",
            display: "flex",
            flexDirection: "column"
        },
        subtext: {
            color: "#999",
            fontSize: "12px"
        },
        infotext: {
            fontSize: "16px"
        },
        datapoint: {
            display: "flex",
            justifyContent: "space-between"
        }

    }
));

const chicago_center = {lat: 41.881944, lng: -87.627778};

const Markers = ({markerState})=>{

    const stationContext = useContext(DataContext);
    // const [viewAllStations, setViewAllStations] = useState(false);
    // const [viewStations, setViewStations] = useState(show);
    // const [numPoints, setNumPoints] = useState(50);

    const handleKeyPress = (e)=>{
        if(e.key === "o"){
            markerState.changeNumPoints(25)
        }
        else if(e.key === "l") {
            markerState.changeNumPoints(-25)
        }
        else if(e.key === "m") {
            markerState.switchViewStations();
        }
        else if(e.key === "a") {
            markerState.switchViewAllStations();
        }
    }

    useEffect(()=>{
        document.addEventListener("keyup", handleKeyPress);
        return ()=>{
            document.removeEventListener("keyup", handleKeyPress)
        }
    }, [])

    const classes = useStyles();
    if(!markerState.viewStations) return null;
    return (
        <React.Fragment>
            Hello
            {
            Object.values(stationContext.stations).slice(0,markerState.viewAllStations?stationContext.numStations:markerState.numPoints).map((station)=>(
                <Marker key={station.station_id} position={[station.lat, station.lon]}>
                    <Popup>
                        <strong>{station.name}</strong>
                        <div className={classes.datapoint}>
                            <span className={classes.subtext}>Available: </span> 
                            <span className={classes.infotext}>{station.num_bikes_available} </span> 
                        </div>
                        <div className={classes.datapoint}>
                            <span className={classes.subtext}>Capacity: </span> 
                            <span className={classes.infotext}>{station.num_docks_available} </span> 
                        </div>

                        
                    </Popup>
                    <Tooltip>{station.num_bikes_available}</Tooltip>
                </Marker>
            ))
            }
        </React.Fragment>
    )
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
}

const getDistance = (a, b) => {
    const R = 6371000; // Radius of the earth in m
    const dLat = deg2rad(b.lat-a.lat);  // deg2rad below
    const dLon = deg2rad(b.lon-a.lon); 
    const e = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(a.lat)) * Math.cos(deg2rad(a.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
    const c = 2 * Math.atan2(Math.sqrt(e), Math.sqrt(1-e)); 
    const d = R * c; // Distance in m
    return d;
}

const getStationsInRegion = (stations, center, radius) => {
    const pos = {lat: center.lat, lon: center.lng};
    const inside = {};
    for(const stationId in stations){
        if(getDistance(pos, stations[stationId])<=radius)
            inside[stationId] = stations[stationId];
    }
    return inside;
};

const getDataInRegion = (stations, center, radius) => {
    const correctStations = getStationsInRegion(stations, center, radius);
    const total = {
        capacity: 0,
        available: 0,
    }
    for(const station in correctStations){
        total.capacity += correctStations[station].num_docks_available;
        total.available += correctStations[station].num_bikes_available;
    }
    return total;
};

const DragMarker = ({visible, radius, switchVisible, changeRadius})=>{
    const [position, setPosition] = useState(chicago_center);
    const markerRef = useRef()
    const onDragged = ()=>{
        const curr = markerRef.current;
        if(!curr) return;
        setPosition(curr.leafletElement.getLatLng());
    }
    const stationContext = useContext(DataContext);
    
    const total = getDataInRegion(stationContext.stations, position, radius*10);
    const classes = useStyles()

    if(!visible) return null;
    return (
        <React.Fragment>
            <Marker
                draggable={true}
                ondrag={onDragged}
                onDragged={onDragged}
                position={position}
                ref={markerRef}
            >
                <Tooltip>Available: {total.available}</Tooltip>
                <Popup>
                    <strong>Total In Region</strong>
                    <div className={classes.datapoint}>
                        <span className={classes.subtext}>Available: </span> 
                        <span className={classes.infotext}>{total.available} </span> 
                    </div>
                    <div className={classes.datapoint}>
                        <span className={classes.subtext}>Capacity: </span> 
                        <span className={classes.infotext}>{total.capacity} </span> 
                    </div>
                </Popup>
            </Marker>
            <Circle
                center={{lat: position.lat-0.0007, lng: position.lng+0.0004}}
                radius={radius*10}
                color="blue"
                fillColor="blue"
            />
        </React.Fragment>
    )
}

export default function MapView({stretch, fullscreen}){
    const classes=useStyles();
    const [zoom, setZoom] = useState(15);
    const [center, setCenter] = useState(chicago_center);
    const handleOnViewportChanged = ({viewport})=>{
        if(!viewport) return;
        setCenter(viewport.center);
        setZoom(viewport.zoom)
    }

    const [markerState, setMarkerState] = useState({
        viewAllStations: false,
        viewStations: false,
        numPoints: 50
    })

    const switchViewAllStations = ()=>setMarkerState(state=>({...state, viewAllStations: !state.viewAllStations}))
    const switchViewStations = ()=>setMarkerState(state=>({...state, viewStations: !state.viewStations}))
    const changeNumPoints = (diff)=>setMarkerState(state=>({...state, numPoints: Math.max(0, state.numPoints+diff)}))

    const [dragMarkerVisible, setDragMarkerVisible] = useState(true);
    const [dragMarkerRadius, setDragMarkerRadius] = useState(50);
    const switchDragMarkerVisible = ()=>setDragMarkerVisible(c=>!c);
    const changeDragMarkerRadius = (diff) => setDragMarkerRadius(r => Math.max(0, r+diff));

    return (
            <div>

                <Map
                    viewport={
                        {
                            center: center,
                            zoom: zoom
                        }
                    }
                    onViewportChange={handleOnViewportChanged}
                    className={clsx(classes.map, {[classes.fullScreenMap]: (fullscreen || !stretch), [classes.fillMap]: (stretch)})}
                >
                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Markers markerState={{
                        viewAllStations: markerState.viewAllStations,
                        viewStations: markerState.viewStations,
                        numPoints: markerState.numPoints,
                        switchViewAllStations,
                        switchViewStations,
                        changeNumPoints
                    }} />

                    <DragMarker visible={dragMarkerVisible} switchVisible={switchDragMarkerVisible}
                        radius={dragMarkerRadius} changeRadius={changeDragMarkerRadius}
                        />
                </Map>
                <div className={ classes.fabContainer }>
                    <Fab className={classes.fab} variant="extended" onClick={switchDragMarkerVisible}>
                        <Typography variant="button">{dragMarkerVisible?"Disable Radius":"Show By Radius"}</Typography>
                    </Fab>
                    {
                        !dragMarkerVisible?null:
                        <Fab className={classes.fab} variant="extended"  onClick={()=>changeDragMarkerRadius(5)}>
                            <Typography variant="button">More</Typography>
                        </Fab>
                    }
                    {
                        !dragMarkerVisible?null:
                        <Fab className={classes.fab} variant="extended" onClick={()=>changeDragMarkerRadius(-5)}>
                            <Typography variant="button">Less</Typography>
                        </Fab>
                    }
                    <Fab className={classes.fab} variant="extended" onClick={switchViewStations}>
                        <Typography variant="button">{markerState.viewStations?"Hide Markers":"Show Markers"}</Typography>
                    </Fab>
                    <Fab className={classes.fab} variant="extended" onClick={switchViewAllStations}>
                        <Typography variant="button">{markerState.viewAllStations?"View Limited":"View All"}</Typography>
                    </Fab>
                    {
                        !markerState.viewStations?null:
                        <Fab className={classes.fab} variant="extended"  onClick={()=>changeNumPoints(25)}>
                            <Typography variant="button">More</Typography>
                        </Fab>
                    }
                    {
                        !markerState.viewStations?null:
                        <Fab className={classes.fab} variant="extended" onClick={()=>changeNumPoints(-25)}>
                            <Typography variant="button">Less</Typography>
                        </Fab>
                    }
                </div>
            </div>
    )
}