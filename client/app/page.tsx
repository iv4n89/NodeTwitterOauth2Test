'use client'

import { TwitterOauthButton } from '@/components/TwitterOauthButton'
import { useMeQuery } from '@/hooks/useMeQuery'
import { useEffect } from 'react';

export default function Home() {

  const { data, loading } = useMeQuery();

  useEffect(() => {
    console.log(data);
  }, [data]);

  return loading && (
    <>Loading</>
  ) || (
    <div className='column-container'>
      <p>Hello!</p>
      {data ? (
        <p> {data.name} </p>
      ) : (
        <>
          <p>You are not logged in! Login with: </p>
          <TwitterOauthButton />
        </>
      )}
    </div>
  )
}
