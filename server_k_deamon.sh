#!/bin/bash
service_name=server_k
directory=/home/pi/bin/middleware
startup_script=start.sh
shutdown_script=stop.sh
logfile=log.txt

usage() {
	echo "-----------------------"
	echo "Usage: $0 (stop|start|restart)"
	echo "-----------------------"
}
if [ -z $1 ]; then
	usage
fi

service_start() {
	echo "Starting service '${service_name}'..."
	owd=`pwd`
	cd $directory && ./$startup_script > $logfile&
	cd $owd
}

service_stop() {
	echo "Stoping service '${service_name}'..."
	owd=`pwd`
	cd $directory && ./$shutdown_script
	cd $owd
}

service_restart() {
	echo "Restarting service '${service_name}'..."
	owd=`pwd`
	cd $directory && ./$shutdown_script; ./$startup_script > $logfile&
	cd $owd
}

case $1 in 
	start)
		service_start
	;;
	stop)
		service_stop
	;;
	restart)
		service_restart
	;;
	*)
		usage
esac
exit 0