import React, { type ComponentType } from 'react'
import SVG from 'react-inlinesvg'

import CardUntyped from '../components/card'
import type { CardProps, IntegrationLogoProps, IntegrationProps } from '../types'

// `card.js` is not converted yet; its inferred props mark every prop
// required, so type it via the curated props at this boundary.
const Card = CardUntyped as ComponentType<CardProps>

import dVCLogo from '../images/logos/dvc.svg'
import prodigyLogo from '../images/logos/prodigy.svg'
import streamlitLogo from '../images/logos/streamlit.svg'
import fastAPILogo from '../images/logos/fastapi.svg'
import wandBLogo from '../images/logos/wandb.svg'
import rayLogo from '../images/logos/ray.svg'
import huggingFaceHubLogo from '../images/logos/huggingface_hub.svg'

const LOGOS: Record<string, string> = {
    dvc: dVCLogo.src,
    prodigy: prodigyLogo.src,
    streamlit: streamlitLogo.src,
    fastapi: fastAPILogo.src,
    wandb: wandBLogo.src,
    ray: rayLogo.src,
    huggingface_hub: huggingFaceHubLogo.src,
}

export const IntegrationLogo = ({
    name,
    title,
    width,
    height,
    maxWidth,
    align,
    ...props
}: IntegrationLogoProps) => {
    const logo = LOGOS[name]
    if (!logo) throw new Error(`Unknown logo: ${name}`)
    const style = { maxWidth, float: align || 'none' }
    return (
        <SVG
            src={logo}
            aria-label={title}
            aria-hidden={title ? undefined : 'true'}
            width={width}
            height={height}
            style={style}
            {...props}
        />
    )
}

export const Integration = ({ height = 30, url, logo, title, children }: IntegrationProps) => {
    const header = logo && (
        <IntegrationLogo name={logo} title={title} height={height} width="auto" maxWidth="80%" />
    )
    return (
        <Card title={header} to={url} small>
            {children}
        </Card>
    )
}
