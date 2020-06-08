import React, {createContext, useEffect} from 'react';
import { useState } from 'react';

const DataContext = createContext({
    stations: {},
})

export default DataContext;

const axios = require('axios').default;

const get_station_details = async ()=>{
    const [station_info, station_status] = await Promise.all( 
        [
            axios.get('https://gbfs.divvybikes.com/gbfs/en/station_information.json'),
            axios.get('https://gbfs.divvybikes.com/gbfs/en/station_status.json'),
        ]
    );
    if(!station_info || station_info.status !== 200 || !station_info.data || !station_info.data.data || !station_info.data.data.stations) return;
    if(!station_status || station_status.status !== 200 || !station_status.data || !station_status.data.data || !station_status.data.data.stations) return;
    
    const new_stations = {}
    
    for(const station of station_info.data.data.stations){
        new_stations[station.station_id] = station
    }

    for(const station of station_status.data.data.stations){
        if(!new_stations[station.station_id]) continue;
        new_stations[station.station_id] = {...station, ...new_stations[station.station_id]}
    }

    return new_stations;
}

export function DataProvider(props){
    const [stations, setStations] = useState({});
    const [length, setLength] = useState({});
    useEffect(()=>{
            get_station_details().then((stations)=>{
                setLength(Object.keys(stations).length);
                setStations(stations);
            }
        );
    }, []);
    return (
        <DataContext.Provider value={{
            stations,
            numStations: length
        }}
        >
            {props.children}
        </DataContext.Provider>
    )
}