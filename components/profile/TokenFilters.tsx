import { Flex, Text } from 'components/primitives'
import { Dispatch, FC, SetStateAction } from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { CollapsibleContent } from 'components/primitives/Collapsible'
import { paths } from '@reservoir0x/reservoir-kit-client'
import Image from 'next/image'
import { NAVBAR_HEIGHT } from 'components/navbar'
import { useRouter } from 'next/router'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  collections: paths['/users/{user}/collections/v2']['get']['responses']['200']['schema']['collections']
  filterCollection: string | undefined
  setFilterCollection: Dispatch<SetStateAction<string | undefined>>
}

export const TokenFilters: FC<Props> = ({
  open,
  setOpen,
  collections,
  filterCollection,
  setFilterCollection,
}) => {
  return (
    <Collapsible.Root
      open={open}
      key="Token Filter"
      onOpenChange={setOpen}
      style={{
        transition: 'width .5s',
        width: open ? 350 : 0,
      }}
    >
      <CollapsibleContent
        css={{
          position: 'sticky',
          top: 16 + 80,
          height: `calc(100vh - ${NAVBAR_HEIGHT}px - 32px)`,
          overflow: 'auto',
        }}
      >
        <Flex
          direction="column"
          css={{
            p: '$2',
            pt: '$4',
            overflowY: 'scroll',
          }}
        >
          <Text style="subtitle1" css={{ mb: '$2', ml: '$3' }}>
            Collections
          </Text>
          {collections?.map((collection) => {
            let selected = collection?.collection?.id == filterCollection
            return (
              <Flex
                key={collection?.collection?.id}
                css={{
                  py: '$2',
                  px: '$3',
                  gap: '$3',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: selected ? '$gray8' : '$gray6',
                  },
                  backgroundColor: selected ? '$gray8' : '',
                }}
                align="center"
                onClick={() => {
                  if (selected) {
                    setFilterCollection(undefined)
                  } else {
                    setFilterCollection(collection?.collection?.id)
                  }
                }}
              >
                <Image
                  style={{ borderRadius: '4px', objectFit: 'cover' }}
                  loader={({ src }) => src}
                  src={collection?.collection?.image as string}
                  alt={collection?.collection?.name as string}
                  width={24}
                  height={24}
                />
                <Text
                  style="body1"
                  css={{
                    flex: 1,
                  }}
                  ellipsify
                >
                  {collection?.collection?.name}
                </Text>
                <Text style="subtitle2" css={{ color: '$gray10' }}>
                  {collection?.ownership?.tokenCount}
                </Text>
              </Flex>
            )
          })}
        </Flex>
      </CollapsibleContent>
    </Collapsible.Root>
  )
}
