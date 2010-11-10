package com.mongodb.rhino;

import java.io.StringWriter;
import java.util.Iterator;

import org.bson.BSONObject;
import org.bson.BasicBSONObject;
import org.mozilla.javascript.ScriptableObject;

/**
 * Direct conversion between native Rhino objects and JSON.
 * <p>
 * This class can be used directly in Rhino.
 * 
 * @author Tal Liron
 */
public class JSON
{
	//
	// Static operations
	//

	/**
	 * Convert from native Rhino to JSON.
	 * 
	 * @param object
	 *        A Rhino native object
	 * @return A JSON representation
	 */
	public static String to( ScriptableObject object )
	{
		Object bson = BSON.to( object );
		if( bson instanceof Iterable<?> )
		{
			StringWriter s = new StringWriter();
			s.write( '[' );
			for( Iterator<?> i = ( (Iterable<?>) bson ).iterator(); i.hasNext(); )
			{
				Object o = i.next();

				if( o instanceof BasicBSONObject )
				{
					s.write( o.toString() );
				}
				else
				{
					s.write( com.mongodb.util.JSON.serialize( o ) );
				}

				if( i.hasNext() )
					s.write( ',' );
			}
			s.write( ']' );
			return s.toString();
		}
		else
		{
			return bson.toString();
		}
	}

	/**
	 * Convert from JSON to a Rhino-compatible object.
	 * 
	 * @param json
	 *        A JSON representation
	 * @return A Rhino-compatible object
	 */
	public static Object from( String json )
	{
		Object bson = com.mongodb.util.JSON.parse( json );
		if( bson instanceof BSONObject )
		{
			return BSON.from( (BSONObject) bson );
		}
		else
		{
			throw new RuntimeException( "Cannot parse JSON" );
		}
	}
}
