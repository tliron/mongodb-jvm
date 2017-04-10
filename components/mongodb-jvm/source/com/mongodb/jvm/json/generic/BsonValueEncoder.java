/**
 * Copyright 2010-2017 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm.json.generic;

import java.io.IOException;
import java.io.StringWriter;
import java.util.List;
import java.util.Map;

import org.bson.BsonValue;
import org.bson.codecs.Codec;
import org.bson.codecs.EncoderContext;
import org.bson.json.JsonWriter;
import org.bson.jvm.Bson;

import com.threecrickets.jvm.json.JsonContext;
import com.threecrickets.jvm.json.JsonEncoder;

/**
 * A JSON encoder for any {@link BsonValue} that is not a map or a list.
 * Delegates to the driver's own {@link JsonWriter} mechanism.
 * 
 * @author Tal Liron
 */
public class BsonValueEncoder implements JsonEncoder
{
	//
	// JsonEncoder
	//

	public boolean canEncode( Object object, JsonContext context )
	{
		return ( object instanceof BsonValue ) && ( !( object instanceof Map ) ) && ( !( object instanceof List ) );
	}

	public void encode( Object object, JsonContext context ) throws IOException
	{
		StringWriter out = new StringWriter();
		@SuppressWarnings("unchecked")
		Codec<Object> codec = (Codec<Object>) Bson.getCodecRegistry().get( object.getClass() );
		JsonWriter writer = new JsonWriter( out );
		// JsonWriter requires a proper document structure
		writer.writeStartDocument();
		writer.writeName( "$" );
		codec.encode( writer, object, EncoderContext.builder().build() );
		StringBuffer buffer = out.getBuffer();
		// Trick: the output will be with '{ "$" : ...}'
		// We'll extract our value!
		context.out.append( buffer.subSequence( 8, buffer.length() ) );
	}
}
