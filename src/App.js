import './App.css'
import {useEffect, useState} from "react"

// request interval in ms, change at your own risk
const INTERVAL = 100

// after how many requests to retest offline websites, change at your own risk
const RETEST_OFFLINE_SITE = INTERVAL * 10

function App() {
    let [getRequests, setRequests] = useState([])
    let [getPostFirstLaunch, setPostFirstLaunch] = useState([])
    let [getTargets, setTargets] = useState([])

    useEffect(() =>
    {
        let targets = [], targetsData = []

        console.log()

        fetch(window.location.pathname+'/targets.txt').then((response) => response.text())
            .then((data) => {
                targets = data.split('\r\n')
                setTargets(targets)
                targets.map(() => targetsData.push({id: 0, online: -1, requests: 0, errors: 0, retest: 0}))
            })

        function check(index, timeOut)
        {
            if(timeOut)
                clearTimeout(timeOut)

            if(!getPostFirstLaunch[index])
            {
                getPostFirstLaunch[index] = true
                setPostFirstLaunch(getPostFirstLaunch)
            }

            const controller = new AbortController()

            const options = {
                method: "GET",
                mode: "no-cors",
                signal: controller.signal
            }

            const timeout = setTimeout(() => abortAndUpdateStats(controller, index), 3000)

            if(getRequests.length === 0)
                getRequests = targetsData

            if(getRequests[index].online) {
                const rand = '/?' + Math.random() * 1000

                fetch("http://" + targets[index] + rand, options)
                    .then(res => {
                        clearTimeout(timeout)
                        setRequestsAndStatus(true, false)

                        return res
                    })
                    .catch(e => {
                        if (e) {
                            if(getRequests[index].retest <= 0)
                                getRequests[index].retest = RETEST_OFFLINE_SITE

                            clearTimeout(timeout)

                            if (e.code === 20)
                                return

                            setRequestsAndStatus(false, true)
                        }
                    })
            }

            else if(getRequests[index].retest-- <= 0) {
                getPostFirstLaunch[index] = false
                setPostFirstLaunch(getPostFirstLaunch)

                setRequestsAndStatus(-1, false)
            }

            function setRequestsAndStatus(online, error)
            {
                const arr = [...getRequests]

                arr[index].id = index
                arr[index].online = online
                online && arr[index].requests++

                if(error)
                    arr[index].errors++

                arr.sort((a, b) => (!!a.online === b.online) ? 0 : !!a.online ? -1 : 1)

                setRequests(arr)
            }
        }

        const interval = setInterval(() => {
            for (let i = 0; i < targets.length; i++)
            {
                if(!getPostFirstLaunch[i]) { // spreading out request to avoid ERR_INSUFFICIENT_RESOURCES
                    const timeOut = setTimeout(() => {check(i, timeOut)}, Math.round(Math.random() * i * i * RETEST_OFFLINE_SITE))
                }

                else
                    check(i)
            }

        }, INTERVAL)

        function abortAndUpdateStats(controller){
            controller.abort()
        }

        return () => clearInterval(interval)
    }, [])

  return (
    <div className="wrapper d-flex justify-content-center mt-3 mb-3">
        <div className="d-flex flex-column align-items-center w-100">
            <div className="d-flex justify-content-center gap-3 mt-1 w-100 mb-3">
                <div className="header cell text-start" style={{minWidth: "200px"}}>Website</div>
                <div className="header cell">Status</div>
                <div className="header cell">Requests</div>
                <div className="header cell">Errors</div>
            </div>
            {
                (getRequests.length > 0 && getTargets.length > 0) ? getRequests.map((req, index) => {
                    return <div className="d-flex justify-content-center gap-3 mt-1 w-100" key={index}>
                        <div className="cell text-start" style={{minWidth: "200px"}}><a href={"http://"+getTargets[index]} target="_blank">{getTargets[index]}</a></div>
                        <div className="cell">{req.online === -1 ? <span style={{color: "grey"}}>Checking...</span> : req.online ? <span className="text-success">Online</span> : <span className="text-danger">Unreachable</span>}</div>
                        <div className="cell">{req.requests}</div>
                        <div className="cell">{req.errors}</div>
                    </div>
                })
                :
                <div>WAITING FOR TARGETS...</div>
            }
            </div>
    </div>
  );
}

export default App
