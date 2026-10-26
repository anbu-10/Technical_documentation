# Distributed Cache Architecture Specification

## 1. Executive Summary & Architecture Overview
The Distributed Cache System is an in-memory, highly available key-value caching layer designed for low-latency technical microservices. It features two-tier caching: an L1 local in-process cache (using LRU policy) and an L2 shared distributed cluster (powered by consistent hashing rings with virtual nodes).

## 2. Core Components and Data Flow
- **Ingress Gateway**: Routes incoming RPC requests to cache proxies.
- **Consistent Hash Ring**: Employs Murmur3 hashing with 256 virtual nodes per physical node to guarantee uniform key distribution.
- **L1 In-Memory Cache**: 128MB per container, sub-microsecond lookup time.
- **L2 Distributed Partition**: Partitioned across nodes with replication factor R=3.
- **Write-Through & Write-Behind Policies**: Configurable per namespace. Default is write-through with asynchronous replication.

## 3. Installation and Setup Requirements
To deploy the distributed cache cluster, ensure the following prerequisites are met:
- Linux kernel 5.4+ with epoll support
- Minimum 16GB RAM and 4 vCPU per cache node
- Python 3.11+ for orchestration and management CLI
- Open ports: 6379 (client traffic), 16379 (cluster gossip protocol), 9090 (Prometheus metrics)

## 4. API Configuration & Endpoints
The cache exposes a high-throughput REST and gRPC interface:
- `POST /api/v1/cache/get`: Retrieves key value. Header `X-Cache-Tier` indicates whether L1 or L2 served the hit.
- `POST /api/v1/cache/set`: Sets key with TTL in seconds. Payload: `{"key": "user:123", "value": "...", "ttl": 3600}`.
- `DELETE /api/v1/cache/invalidate`: Explicitly flushes key or wildcard pattern.

## 5. Troubleshooting & Error Recovery
- **Error ERR_NODE_TIMEOUT**: Occurs when gossip ping exceeds 500ms. Check network partitions or CPU throttling.
- **Cache Stampede (Thundering Herd)**: Mitigated using mutex lock leases with exponential backoff on cache misses.
- **Out of Memory (OOM)**: Automatic eviction triggers when memory reaches 90% threshold using volatile-lru policy.
