export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/admin/index.html',
      permanent: false,
    },
  };
}
export default function Admin() { return null; }
