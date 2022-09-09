const fs = require('fs');

(async () => {
    // for (let i = 1; i <= 3375; i++){
    //     fs.mkdirSync(`E:/MetaLand/Image/content/${i}/`);
    //     fs.copyFileSync('E:/MetaLand/Image/1', `E:/MetaLand/Image/content/${i}/content`);
    //     console.log(i);
    // }
    for (let i = 1; i <= 3375; i++ ){
        console.log(i);
        const x = Math.floor((i - 1) / 225) - 7;
        const y = Math.floor(((i - 1) % 225)/15) - 7;
        const z = ((i - 1) % 15) - 7;
        const Distance = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));

        const metadata = {
            name: `Metaverse [${x}, ${y}, ${z}]`,
            description: "Unique Tier 0 metaverse. The metaverse functions as a virtual society and can contain its own games, interactive experiences, economy, and governance. Owner of the metaverse NFT can customize its content, perform administrative functions, and create nested metaverses. Learn more at metametaverse.io",
            image: `https://metaverse-nft-metadata-images.s3.eu-central-1.amazonaws.com/media/${i}/metaverse-preview`,
            animation_url: 'https://metaverse-nft-metadata-images.s3.eu-central-1.amazonaws.com/metaverse-animation',
            "external_url": `https://map.metametaverse.io/metamap?zoomTo=x${x}y${y}z${z}`,
            attributes: [
                {trait_type: 'X', value: x.toString()},
                {trait_type: 'Y', value: y.toString()},
                {trait_type: 'Z', value: z.toString()},
                {trait_type: 'Distance', value: Distance.toString() },
                {trait_type: 'Tier', value: '0'}
            ]
        };

        fs.writeFileSync(`Metadata/${i}`, JSON.stringify(metadata),);
    }
})().then(_ => console.log('done'));