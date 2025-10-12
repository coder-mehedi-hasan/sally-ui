import React from "react"
import useIntersectionObserver from "./useIntersectionObserver.jsx"

const Component = () => {
    const [hidden, setHidden] = React.useState(false)
    const cbRef = useIntersectionObserver({ threshold: 1 }, (entries) => {
        entries.forEach((entry) => {
            console.log('entry', entry)
            setHidden(!entry.isIntersect)
        })
    })

    console.log('hidden', hidden    )

    return (
        <div>
            <div ref={cbRef} />
            {hidden && <div>its hidden</div>}
        </div>
    )
}
export default Component