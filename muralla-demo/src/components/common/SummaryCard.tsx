import { Box, Heading, Text } from '@chakra-ui/react'

export default function SummaryCard({ title, value, subtext, accent }: { title: string; value: string; subtext?: string; accent?: string }) {
  return (
    <Box p={5} bg="white" _dark={{ bg: 'gray.800' }} rounded="lg" borderWidth="1px">
      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>{title}</Text>
      <Heading size="lg" mt={1}>{value}</Heading>
      {subtext && (
        <Text mt={2} fontSize="sm" color={accent || 'gray.500'}>{subtext}</Text>
      )}
    </Box>
  )
}
