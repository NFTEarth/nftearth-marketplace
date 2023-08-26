import {request, RequestDocument, Variables} from 'graphql-request'
import useSWRInfinite, { SWRInfiniteConfiguration } from 'swr/infinite'
import fetcher from "../utils/fetcher";
import {useCallback, useState} from "react";
import {useSWRConfig} from "swr";
import {Round} from "./useFortuneRound";

const subgraphFetcher = <T>([query, variables]: [RequestDocument, Variables]) =>
  request<T>('https://api.thegraph.com/subgraphs/name/ryuzaki01/fortune', query, variables)

type RoundResult = {
  rounds: Round[]
}

type RoundHistoryFilter = {
  first: number,
  skip: number,
  where?: any
}

const useFortuneHistory = (filter : RoundHistoryFilter, options?: SWRInfiniteConfiguration) => {
  const [keys, setKeys] = useState<string[]>([])
  const { mutate: globalMutate } = useSWRConfig()

  const getKey = useCallback((pageIndex: number, previousPageData: RoundResult) => {
    if (previousPageData && previousPageData.rounds.length === 0) {
      return null
    } else if (previousPageData && pageIndex > 0) {
      filter.skip = pageIndex * filter.first
    }

    const query = `query GetHistoryRounds($first: Int!, $skip: Int!, $where: Round_filter) {
        rounds(orderBy: roundId, orderDirection: desc, first: $first, skip: $skip, where: $where) {
          id
          roundId
          status
          cutoffTime
          maximumNumberOfDeposits
          maximumNumberOfParticipants
          valuePerEntry
          numberOfEntries
          numberOfParticipants
          winner
          drawnHash
          protocolFeeBp
          deposits(orderBy: indice, orderDirection: asc, first: 1000) {
            id
            depositor
            tokenAddress
            tokenAmount
            tokenId
            tokenType
            numberOfEntries
            indice
            claimed
            entry {
              totalNumberOfEntries
            }
          }
        }
      }`
    return [query, filter]
  }, [filter])



  const {data, error, mutate, size, setSize} = useSWRInfinite<RoundResult>(
    (pageIndex, previousPageData) => {
      const params = getKey(pageIndex, previousPageData)
      const key = params && params[1] ? JSON.stringify(params[1]) : null
      if (key && !keys.includes(key)) {
        setKeys([...keys, key])
      }

      return params
    },
    subgraphFetcher,
    {
      revalidateOnMount: true,
      revalidateFirstPage: false,
      ...options,
    }
  )

  let hasNextPage: boolean
  if (filter.first !== undefined) {
    hasNextPage =
      size === 0 || (data?.[size - 1]?.rounds || []).length === filter.first
  } else {
    hasNextPage = size === 0 || (data?.[size - 1]?.rounds || []).length > 0
  }

  const isFetchingInitialData = !data && !error && size > 0
  const isFetchingPage =
    size > 0 &&
    (isFetchingInitialData || (data && typeof data[size - 1] === 'undefined'))

  const resetCache = () => {
    setSize(0)
    return mutate(undefined, {
      revalidate: false,
    }).then(() => {
      globalMutate(
        (key) => {
          const url = key && key[0] ? key[0] : null
          if (url) {
            return keys.includes(url)
          }
          return false
        },
        undefined,
        false
      ).then(() => {
        setKeys([])
      })
    })
  }

  const fetchNextPage = () => {
    if (!isFetchingPage && hasNextPage) {
      setSize((size) => size + 1)
    }
  }

  return {
    data: (data || []).flatMap((page) => page.rounds || []) ?? [],
    error,
    hasNextPage,
    isFetchingPage,
    isFetchingInitialData,
    resetCache,
    fetchNextPage
  };
}

export default useFortuneHistory;