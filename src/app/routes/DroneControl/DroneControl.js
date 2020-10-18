import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import DroneData from '../../../containers/DroneData/DroneData';
import RotatedMarker from '../../../homeComponents/RotatedMarker/RotatedMarker';
import { Map, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from "leaflet";
import Green from '../../../assets/green.png';
import { NotificationContainer, NotificationManager } from 'react-notifications';
import url from '../../../url';
import io from 'socket.io-client';
import * as actions from '../../../store/actions/droneControl';
import * as missionActions from '../../../store/actions/mission';
import {AttitudeIndicator, HeadingIndicator} from 'react-flight-indicators';
import Dialog from '../../../homeComponents/Dialog/Dialog';

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        // backgroundColor: '#E7E7E7',
        backgroundColor: '#495057',
        height: '89vh'
    },
    data: {
        zIndex: 500,
        position: 'relative',
        height: '100%'
    }
}));

const droneIcon = new Icon({
    iconUrl: Green,
    iconSize: [25, 25]
});

const DroneControl = props => {

    const classes = useStyles();
    let socket = useRef();
    const dispatch = useDispatch(); 

    const [openMissionList, setOpenMissionList] = React.useState(false);
    const [openCheckList, setOpenCheckList] = React.useState(false);
    const [openDroneList, setOpenDroneList] = React.useState(false);

    const [droneConnected, setDroneConnected] = React.useState(false);
    const [droneFirstConnected, setDroneFirstConnected] = React.useState(false);

    const [showMissionDetail, setShowMissionDetail] = React.useState(false);
    const [mission, setMission] = React.useState(null);
    const [enableFly, setEnableFly] = React.useState(false);

    const [droneInfo, setDroneInfo] = React.useState(null);
    const [drone, setDrone] = React.useState(null);

    const [home, setHome] = React.useState({ lat: 26.818123, lng: 87.281345 });
    const [missionState, setMissionState] = React.useState(null);
    const [dialogData, setDialogData] = React.useState({open: false, handleClose: null})
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [command, setCommand] = React.useState(null);

    const activeDrones = useSelector(({ droneControl }) => droneControl.activeDrones);
    const userId = useSelector(({ auth }) => auth.userId);
    const missionDetail = useSelector(({ mission }) => mission.missionDetail);
    const checklistPass = useSelector(({droneControl}) => droneControl.checklistPass)

    //for loading mission from server
    useEffect(() => {
        setMissionState(missionDetail);
    }, [missionDetail]);

    //for loading mission from drone
    const setMissionDetail = (mission) => {
        if (mission.waypoints !== undefined) {
            setMissionState({ ...missionState, ...mission }, () => console.log(missionState));
        }
    }

    const setData = (data) => {
        setDroneInfo(data);
    }

    const setHomePosition = (position) => {
        console.log(position);
        setHome({
            ...home, lat: position.lat, lng: position.lng
        });
    }

    useEffect(() => {
        // console.log(drone);
        if (drone !== null) {
            console.log("send socket connection", drone);
            const d = new Date();
            const n = d.getMilliseconds();
            socket.current = io(`${url}/${drone}`);
            socket.current.emit("joinDMS", userId);
            socket.current.emit("homePosition", { timestamp: n })
            socket.current.on("copter-data", setData);
            socket.current.on("homePosition", setHomePosition)
            socket.current.on('getMission', setMissionDetail);
            socket.current.on('connect', () => {
                NotificationManager.info("Drone Connected");
                // console.log("Connected Again");
                setDroneFirstConnected(true);
                setDroneConnected(true);
            })
            socket.current.on('disconnect', (reason) => {
                // console.log(reason, "disconnected")
                NotificationManager.info("Drone Disconnected");
                
                // if (reason === 'io server disconnect' || reason === 'transport close disconnected') {
                // the disconnection was initiated by the server, you need to reconnect manually
                socket.current.connect();
                socket.current.emit("joinDMS", userId);
                // }
                // else the socket will automatically try to reconnect
            });
            return function cleanup() {
                setDroneConnected(false);
                console.log("Drone disconnect cleanup")
                socket.current.removeAllListeners();
                socket.current.disconnect();
            };
        }
    }, [drone, userId]);


    const handleOpenMission = () => {
        // console.log("Handle Open Mission");
        setOpenMissionList(true);
    };

    const handleCloseMission = () => {
        setOpenMissionList(false);
    };

    const handleOpenCheck = () => {
        // console.log("Handle Open Check");
        setOpenCheckList(true);
    };

    const handleCloseCheck = () => {
        setOpenCheckList(false);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false)
    }

    const handleOpenDrone = () => {
        // console.log("Handle Open Drone");
        dispatch(actions.fetchActiveDrones());
        setOpenDroneList(true);
    };

    const handleCloseDrone = () => {
        setOpenDroneList(false);
    };

    const selectDrone = (drone) => {
        // console.log(drone);
        // socket.current.off("joinDMS");
        setDrone(drone);
        setOpenDroneList(false);

    }

    const selectMission = (mission) => {
        // console.log(mission)
        setMission(mission);
        setOpenMissionList(false);
        dispatch(missionActions.getMission(mission));
        setShowMissionDetail(true);
        // socket.current.emit("mission",mission);
    }

    const uploadMission = () => {
        // console.log(missionState);
        const d = new Date();
        const n = d.getMilliseconds();
        socket.current.emit("mission", { mission: mission, timestamp: n });
    }

    const onDownloadMission = () => {
        const d = new Date();
        const n = d.getMilliseconds();
        socket.current.emit("getMission", { timestamp: n })
        setShowMissionDetail(false);

    }

    const onStartMission = () => {
        const d = new Date();
        const n = d.getMilliseconds();
        socket.current.emit("initiateFlight", { timestamp: n })
    }

    const onLand = () => {

        const d = new Date();
        const n = d.getMilliseconds();
        socket.current.emit("land", { timestamp: n });
    }

    const onRTL = () => {
        const d = new Date();
        const n = d.getMilliseconds();
        socket.current.emit("rtl", { timestamp: n });
    }

    const setCommandMessage = (command) => {
        setCommand(command);
        setDialogOpen(true);
    }

    const sendCommand = () => {
        setDialogOpen(false);
        const d = new Date();
        const n = d.getMilliseconds();
        socket.current.emit(command, { timestamp: n });
        setCommand(null);
    }

    return <Grid container className={classes.root} >
        <Grid item xs={3}>
            <DroneData
                onDownloadMission={onDownloadMission}
                // onStartMission={onStartMission}
                // onLand={onLand}
                // onRTL={onRTL}
                checklistPass={checklistPass}
                onStartMission={setCommandMessage}
                onLand={setCommandMessage}
                onRTL={setCommandMessage}
                uploadMission={uploadMission}
                selectMission={selectMission}
                selectDrone={selectDrone}
                handleCloseDrone={handleCloseDrone}
                handleOpenDrone={handleOpenDrone}
                handleCloseCheck={handleCloseCheck}
                handleOpenCheck={handleOpenCheck}
                handleCloseMission={handleCloseMission}
                handleOpenMission={handleOpenMission}
                showMissionDetail={showMissionDetail}
                droneFirstConnected={droneFirstConnected}
                droneConnected={droneConnected}
                droneInfo={droneInfo}
                mission={missionDetail}
                openMissionList={openMissionList}
                openCheckList={openCheckList}
                openDroneList={openDroneList}
                activeDrones={activeDrones}

            />
        </Grid>
        <Grid item xs={9}>
            <Dialog open={dialogOpen} command={command} handleClose={handleCloseDialog} agree={sendCommand}/>
            <NotificationContainer />
            <Map
                center={[home.lat, home.lng]}
                zoom={17}
                style={{ width: '100%', height: '100%', zIndex: 0 }}
                zoomControl={false}
            >
                <Grid container className={classes.data}>
                    <Grid item xs={9}>

                    </Grid>

                    <Grid item xs={3} container alignItems='flex-start' justify='flex-end' >
                        {droneInfo !== null ? <span><AttitudeIndicator size={100} roll={(droneInfo.roll * 180) / 3.14} pitch={(droneInfo.pitch * 180) / 3.14} showBox={false} />
                            <HeadingIndicator size={100} heading={droneInfo.head} showBox={false} /></span> : null}
                    </Grid>
                </Grid>
                <TileLayer
                    attribution='&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {droneInfo !== null ? <RotatedMarker icon={droneIcon} position={[droneInfo.lat, droneInfo.lng]} rotationAngle={droneInfo.head} rotationOrigin={'center'} /> : null}

                {missionState !== null && missionState !== undefined ? missionState.waypoints.map((miss, i, array) => {
                    // console.log(miss);
                    return (<span key={i}><Marker
                        position={[miss.lat, miss.lng]}>
                        <Popup minWidth={90}>
                            <span >
                                <span>{miss.action} </span>
                                <br />
                                <span>Alt: {miss.altitude}m</span><br />
                            </span>
                        </Popup>
                    </Marker>
                        {/* for lines between markers */}
                        {array[i - 1] ? <Polyline weight={1} positions={[
                            [array[i - 1].lat, array[i - 1].lng], [array[i].lat, array[i].lng],
                        ]} color={'red'} /> : null}
                  }
                    </span>
                    )
                }) : null
                }
            </Map>
        </Grid>
    </Grid>
}

export default DroneControl;