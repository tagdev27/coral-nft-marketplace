import { ethers } from "ethers"
import { useEffect, useState } from "react"
import axios from 'axios'
import Web3Modal from "web3modal"

import {
    nftaddress, nftmarketaddress
} from "../config"

import NFT from "../artifacts/contracts/NFT.sol/NFT.json"
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json"

export default function MyAssets() {
    const [nfts, setNfts] = useState([]) //default for buy
    const [rent, setRent] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')

    useEffect(() => {
        loadNFTs()
    }, [])

    async function loadNFTs() {
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
        const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        const data = await marketContract.fetchMyNFTs()

        const items = await Promise.all(data.map(async i => {
            const tokenUri = await tokenContract.tokenURI(i.tokenId)
            const meta = await axios.get(tokenUri)
            let price = ethers.utils.formatUnits(i.price.toString(), 'ether')

            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                isBuy: i.isBuy,
                expiredDate: i.expiredDate,
                owner: i.owner,
                image: meta.data.image,
                name: meta.data.name,
                description: meta.data.description
            }
            return item
        }))

        let rentItems = items.filter(i => !i.isBuy)
        let buyItems = items.filter(i => i.isBuy)

        setNfts(buyItems)
        setRent(rentItems)
        setLoadingState('loaded')
    }

    if (loadingState === 'loaded' && !nfts.length && !rent.length) {
        return (<h1 className="px-20 py-10 text-3xl">No digital assets owned</h1>)
    }

    return (
        <div className="flex justify-center">
            <h2 className="text-2xl py-2">Bought Items</h2>
            <div className="px-4">
                <div className="grid ">
                    {
                        nfts.map((nft, i) => (
                            <div key={i} className="border shadow rounded-xl overflow-hidden">
                                <img src={nft.image} className="rounded" />
                                <div className="p-4">
                                    <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                                    <div style={{ height: '70px', overflow: 'hidden' }}>
                                        <p className="text-grey-400">{nft.description}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-black">
                                    <p className="text-2xl mb-4 font-bold text-white">Price - {nft.price} MATIC</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
            <h2 className="text-2xl py-2">Rented Items</h2>
            <div className="px-4">
                <div className="grid">
                    {
                        rent.map((nft, i) => (
                            <div key={i} className="border shadow rounded-xl overflow-hidden">
                                <img src={nft.image} className="rounded" />
                                <div className="p-4">
                                    <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                                    <div style={{ height: '70px', overflow: 'hidden' }}>
                                        <p className="text-grey-400">{nft.description}</p>
                                    </div>
                                    <div style={{ height: '70px', overflow: 'hidden' }}>
                                        <p className="text-grey-400">Expiring in: {nft.expiredDate}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-black">
                                    <p className="text-2xl mb-4 font-bold text-white">Price - {nft.price} MATIC</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )

}