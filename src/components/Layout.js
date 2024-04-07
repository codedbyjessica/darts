import React from "react"
import { GlobalStyles } from "twin.macro";

const Layout = ({ children }) => {
    return (
        <>
            <GlobalStyles />

            <main tw="!min-h-screen !w-screen bg-red-100">
                {children}
            </main>
        </>
    )
}

export default Layout

