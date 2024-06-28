const mysql = require('mysql2/promise');
const crypto = require('crypto');
const moment = require('moment');

var nec_count = 0;
var eeei_count = 0;
var melchor_count = 0;

var timeForLB = moment().subtract(7, 'minutes').format('YYYY-MM-DD HH:mm:ss');

console.log('Balancing all data received starting from ' + timeForLB);

// reconfigure according to which databases from which hosts you are using
const config = [
    { host: '100.83.107.52', user: 'care1', password: 'password', database: 'dbforlb' },
    { host: '100.92.199.110', user: 'care1', password: 'password', database: 'dbforlb' },
    { host: '100.64.196.100', user: 'care1', password: 'password', database: 'dbforlb' },
];

const createPools = (config) => config.map(cfg => mysql.createPool(cfg));

async function checkPoolConnection(pool) {
    try {
        const connection = await pool.getConnection();
        await connection.query('SELECT 1');  // Simple query to check the connection
        connection.release();
        console.log('Successfully connected to database:', pools.indexOf(pool));
        return true;
    } catch (error) {
        console.error('Failed to connect to database:', pools.indexOf(pool));
        return false;
    }
}

async function filterValidPools(pools) {
    const checks = pools.map(pool => checkPoolConnection(pool));
    const results = await Promise.all(checks);
    return pools.filter((_, index) => results[index]);  // Keep only the pools where the connection was successful
}

const hashFunction = (key) => {
    return parseInt(crypto.createHash('sha256').update(key.toString()).digest('hex').slice(0, 8), 16);
};

async function fetchAllRows(pools) {
    try {
        const fetchQueries = pools.map(pool => pool.query("SELECT * FROM cin WHERE ct > '" + timeForLB + "' ;"));
        const results = await Promise.all(fetchQueries);
        const rows = results.map(result => result[0]);
        rows.forEach((row, i) => {
            console.log(`Gateway ${i} has ${row.length} new rows.`);
        });
        const shard = rows.map((row, i) => row.map(r => ({ ...r, originIndex: i, hash: hashFunction(r.ri)}))).flat();
        return shard
    } catch (error) {
        console.error('Error fetching rows:', error);
        throw error;
    }
}

async function redistributeData(pools) {
    try {
        const validPools = await filterValidPools(pools);
        if (validPools.length === 0) {
            console.error("No valid database connections available.");
            return;
        }
        const rows = await fetchAllRows(validPools);
        const shards = validPools.length;
        const shardRows = [];

        rows.forEach(row => {
            row.shardIndex = row.hash % shards;
            delete row.hash;
            shardRows.push(row);
        });

        for (let i = 0; i < shards; i++) {
            const pool = pools[i];
            const connection = await pool.getConnection();

            if (!connection) {
                console.error(`Failed to get connection for shard ${i}`);
                continue;
            }

            await connection.beginTransaction();

            try {
                for (let row of shardRows) {

                    if(row.originIndex == 0){
                        nec_count++;
                    }else if(row.originIndex == 1){
                        melchor_count++;
                    }else if(row.originIndex == 2){
                        eeei_count++;
                    };

                    console.log('Nec Count: ', nec_count, 'Melchor Count: ', melchor_count, 'Eeei Count: ', eeei_count);

                    // if shardIndex is the same as i and originIndex, skip
                    if (row.shardIndex === i && row.originIndex === i) {
                        continue;
                    };

                    // if shardIndex is same to i but originIndex is different, insert
                    if (row.shardIndex === i && row.originIndex !== i) {
                        const keys = Object.keys(row).filter(k => k !== 'hash' && k !== 'shardIndex' && k !== 'originIndex');
                        const values = keys.map(key => row[key]);
                        const placeholders = keys.map(() => '?').join(', ');
                        const insertLookup = `INSERT IGNORE INTO lookup (pi, ri, ty, ct, st, rn, lt, et, acpi, lbl, at, aa, sri, spi, subl) VALUES ('${row.pi}', '${row.ri}', 4, '', 0, '', '', '', '', '', '', '', '', '', '')`;
                        await connection.query(insertLookup);
                        const insertQuery = `INSERT INTO cin (${keys.map(key => `\`${key}\``).join(', ')}) VALUES (${placeholders})`;
                        await connection.query(insertQuery, values);
                    }

                    // if originIndex is the same as i but shardIndex is different, delete
                    if (row.originIndex === i && row.shardIndex !== i) {
                        const deleteQuery = `DELETE FROM cin WHERE ri = '${row.ri}'`;
                        await connection.query(deleteQuery);
                    }
                }

                await connection.commit();
            } catch (error) {
                console.error(`Failed to redistribute data in shard ${row.shardIndex} from ${row.originIndex}:`, error);
                await connection.rollback();
            } finally {
                connection.release();
            }
        }
                
    } catch (error) {
        console.error('Failed to process rows at database:', error);
    }    
}



const pools = createPools(config);

//redistribute pools and exit the async function

redistributeData(pools).then(() => {
    console.log('Data redistribution complete.');
}).catch(error => {
    console.error('Failed to redistribute data:', error);
}
);
