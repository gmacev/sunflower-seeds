import './App.css'
import {useEffect, useState} from "react"

// request interval in ms, change at your own risk
const INTERVAL = 100

// after how many requests to retest offline websites, change at your own risk
const RETEST_OFFLINE_SITE = INTERVAL * 10

function App() {
    let [getTargetsData, setRequests] = useState([])
    let [getPostFirstLaunch, setPostFirstLaunch] = useState([])

    useEffect(() =>
    {
        let targets = [], targetsData = []

        fetch(window.location.pathname+'targets.txt', {mode: 'no-cors'}).then((response) => response.text())
            .then((data) => {
                targets = data.split('\r\n')
                targets.map(target => targetsData.push({target: target, online: -1, requests: 0, errors: 0, retest: 0}))
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

            if(getTargetsData.length === 0)
                getTargetsData = targetsData

            if(getTargetsData[index].online) {
                const rand = '/?' + Math.random() * 1000

                fetch("http://" + targets[index] + rand, options)
                    .then(res => {
                        clearTimeout(timeout)
                        setRequestsAndStatus(true, false)

                        return res
                    })
                    .catch(e => {
                        if (e) {
                            if(getTargetsData[index].retest <= 0)
                                getTargetsData[index].retest = RETEST_OFFLINE_SITE

                            clearTimeout(timeout)

                            if (e.code === 20)
                                return

                            setRequestsAndStatus(false, true)
                        }
                    })
            }

            else if(getTargetsData[index].retest-- <= 0) {
                getPostFirstLaunch[index] = false
                setPostFirstLaunch(getPostFirstLaunch)

                setRequestsAndStatus(-1, false)
            }

            function setRequestsAndStatus(online, error)
            {
                const arr = [...getTargetsData]
                
                arr[index].online = online
                online && arr[index].requests++
                error && arr[index].errors++

                arr.sort((a, b) => (!!a.online === b.online) ? 0 : !!a.online ? -1 : 1)

                setRequests(arr)
            }
        }

        const interval = setInterval(() => {
            for (let i = 0; i < targets.length; i++)
            {
                if(!getPostFirstLaunch[i]) { // spreading out requests to avoid ERR_INSUFFICIENT_RESOURCES
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
                <div className="header cell text-start" style={{width: "200px"}}>Website</div>
                <div className="header cell">Status</div>
                <div className="header cell">Requests</div>
                <div className="header cell">Errors</div>
            </div>
            {
                (getTargetsData.length > 0) ? getTargetsData.map((target, index) => {
                    return <div className="d-flex align-items-center justify-content-center gap-3 mt-1 w-100" key={index}>
                        <div className="cell text-start" style={{width: "200px"}}>
                            <a
                                href={"http://"+target.target}
                                rel="noreferrer" target="_blank"
                                title={target.target}>{target.target.length > 25 ? `${target.target.substring(0, 25)}...` : target.target}
                            </a>
                        </div>
                        <div className="cell">{target.online === -1 ?
                            <span style={{color: "grey"}}>Checking...</span> : target.online ?
                                <span className="text-success">Online</span> : <span className="text-danger">Unreachable</span>}
                        </div>
                        <div className="cell">{target.requests}</div>
                        <div className="cell">{target.errors}</div>
                    </div>
                })
                :
                <div>LOADING...</div>
            }
            </div>
    </div>
  );
}

export default App
